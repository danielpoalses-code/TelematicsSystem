// Standalone single-file entry for the demo: uses HashRouter so the built
// HTML can be opened by double-click (file://) with no web server.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import DemoApp from './DemoApp';
import '../index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HashRouter>
            <Routes>
                <Route path="/demo/*" element={<DemoApp />} />
                <Route path="*" element={<Navigate to="/demo" replace />} />
            </Routes>
        </HashRouter>
    </React.StrictMode>,
);
