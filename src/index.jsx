import { render } from 'preact';
import AppComponent from "./app.jsx";
import { createBus } from './data/bus.js';
import { migrate } from './data/migrate.js';
import { createDataStore, useStore } from './data/store.js';
import { registerSync } from './sync/index.js';

const bus = createBus();

migrate(localStorage);

const store = createDataStore({ storage: localStorage, bus, win: window });

registerSync();

function App() {
    const data = useStore(store);

    return <AppComponent store={store} bus={bus} data={data} />;
}

render(<App />, document.getElementById('app'))
