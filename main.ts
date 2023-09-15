import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import '@polkadot/api-augment';
import type { FrameSystemAccountInfo } from "@polkadot/types/lookup";
import { KeyringPair } from '@polkadot/keyring/types';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const WEB_SOCKET = 'ws://127.0.0.1:9944';
const connect = async () => {
    const wsProvider = new WsProvider(WEB_SOCKET);
    const api = await ApiPromise.create({provider: wsProvider, types: {}});
    await api.isReady;
    return api;
}

const getConst = async (api: ApiPromise) => {
    const existentialDeposit = await api.consts.balances.existentialDeposit.toHuman();
    return existentialDeposit;
}

const getFreeBalance = async (api: ApiPromise, address: string) => {
    const { data: { free, }, }: FrameSystemAccountInfo = await api.query.system.account(address);
    return free;
}

const transfer = async (api: ApiPromise, alice: KeyringPair, bob: string, amount: number) => {
    await api.tx.balances.transfer(bob, amount)
    .signAndSend(alice, res => {
        console.log(`Tx status: ${res.status}`);
    });
}

const getMetadata = async (api: ApiPromise) => {
    const metadata = await api.rpc.state.getMetadata();
    return metadata.toString();
}

const subscribe = async (api: ApiPromise, address: string) => {
    await api.query.system.account(address, aliceInfo => {
        const free = aliceInfo.data.free;
        console.log('free balance is: ', free.toHuman());
    })
}

const subscribe_event = async (api: ApiPromise) => {
    await api.query.system.events(events => {
        events.forEach( function (event) {
            console.log('index ', event['event']['index'].toHuman());
            console.log('data ', event['event']['data'].toHuman());
        })
    })
}

const getSomething = async (api: ApiPromise) => {
    return await api.query.templateModule.something();
}

const subscribe_template = async (api: ApiPromise) => {  
    await api.query.system.events(events => {
        events.forEach( (record) => {
            const { event, phase } = record;
            if(phase.isApplyExtrinsic && (api.events.templateModule.SomethingStored.is(event))) {
                console.log('index ', record['event']['index'].toHuman());
                console.log('data ', record['event']['data'].toHuman());
            }
        });    
    });
}

const main = async () => {
    const api = await connect();

    const deposit = await getConst(api);
    console.log("deposit is ", deposit);

    const keyring = new Keyring({type: 'sr25519'});
    const alice = keyring.addFromUri('//Alice');
    // const free = await getFreeBalance(api, alice.address);
    // console.log("alice balance is ", free.toHuman());

    // const bob = keyring.addFromUri('//Bob');
    // const bob_balance = await getFreeBalance(api, bob.address);
    // console.log("bob_balance is ", bob_balance.toHuman());
    // await transfer(api, alice, bob.address, 10 ** 10 + 1);
    // await sleep(10000);
    // const bob_balance_after_transfer = await getFreeBalance(api, bob.address);
    // console.log("bob_balance_after_transfer is ", bob_balance_after_transfer.toHuman());

    //console.log('metadata is: ', await getMetadata(api));

    //await subscribe(api, alice.address);

    //await subscribe_event(api);

    await subscribe_template(api);

    await sleep(10000);
  
    console.log('main function');
}

main()
.then(() => {
    console.log('exit with success');
    process.exit(0);
})
.catch(err => {
    console.log('error is ', err);
    process.exit(1);
})