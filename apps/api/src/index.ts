import cors from 'cors';
import express from 'express';
import { router } from './routes/v1/user';
import { websiteRouter } from './routes/v1/website';

const app = express();
app.use(
    cors({
        origin: true,
        credentials: true
    })
);
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).send('ok');
});

app.use('/api/v1',router);
app.use('/api/v1',websiteRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`starting at ${port}`);
});