import 'dotenv/config';
import app from './app';
import { connectToDatabase } from './lib/mongodb';

const port = Number(process.env.PORT ?? 3000);

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
