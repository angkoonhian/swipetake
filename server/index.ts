import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { router } from './routes.js';
import { initDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', router);

// Serve static frontend built by Vite
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;

// Start server — database is optional (votes work only when DATABASE_URL is set)
if (process.env.DATABASE_URL) {
  initDb()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT} (with database)`));
    })
    .catch((err) => {
      console.error('Database init failed, starting without votes:', err.message);
      app.listen(PORT, () => console.log(`Server running on port ${PORT} (without database)`));
    });
} else {
  console.log('No DATABASE_URL set — vote tallying disabled');
  app.listen(PORT, () => console.log(`Server running on port ${PORT} (without database)`));
}
