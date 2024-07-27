'use strict';

import React from 'react';
import AppComponent from "./app.jsx";

/**
 * Render the AppComponent in the DOM element with id 'app'.
 */
React.render(
    // Render the AppComponent
    <React.StrictMode>
        <AppComponent />
    </React.StrictMode>,
    // Find the DOM element with id 'app' and render the AppComponent inside it
    document.getElementById('app')
    // The AppComponent will replace the content of the DOM element with id 'app'
    // The AppComponent will manage its own state and will re-render when the state changes
)
