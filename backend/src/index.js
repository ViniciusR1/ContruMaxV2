import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productsRouter from './routes/products.js';
import movimentacoesRouter from './routes/movimentacoes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors({
  origin: ['https://construmaxv2.netlify.app', 'http://localhost:5173']
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/products', productsRouter);
app.use('/api/movimentacoes', movimentacoesRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`🏗️  ConstruMax API rodando na porta ${PORT}`);
});
