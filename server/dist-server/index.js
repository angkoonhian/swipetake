"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = require("./routes");
const db_1 = require("./db");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', routes_1.router);
// Serve static frontend built by Vite
app.use(express_1.default.static(path_1.default.join(__dirname, '../dist')));
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../dist/index.html'));
});
const PORT = process.env.PORT || 3000;
(0, db_1.initDb)()
    .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
    .catch((err) => {
    console.error('Failed to initialise database', err);
    process.exit(1);
});
