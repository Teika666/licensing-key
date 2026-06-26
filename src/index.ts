import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import activateRoute from './routes/activate';
import validateRoute from './routes/validate';
import deactivateRoute from './routes/deactivate';

const app = express();

app.use(helmet());
app.use(express.json({ limit: '1kb' }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use('/api/v1/license', activateRoute);
app.use('/api/v1/license', validateRoute);
app.use('/api/v1/license', deactivateRoute);

const PORT = parseInt(process.env.PORT || '443', 10);
const MONGO_URI = process.env.MONGO_URI!;

mongoose.connect(MONGO_URI).then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`License API listening on ${PORT}`));
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
