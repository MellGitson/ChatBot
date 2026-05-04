import express from 'express';
import PDFDocument from 'pdfkit';
import { Chatbot, PROVIDERS } from './chatbot-core.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Stocker les sessions par ID client
const sessions = new Map();

// Middleware pour obtenir ou créer une session
function getOrCreateSession(req, res, next) {
  const clientId = req.query.client_id || req.headers['x-client-id'] || 'default';
  
  if (!sessions.has(clientId)) {
    const provider = req.query.provider || 'mistral';
    sessions.set(clientId, new Chatbot(provider));
  }
  
  req.session = sessions.get(clientId);
  req.clientId = clientId;
  next();
}

// Appliquer le middleware à toutes les routes
app.use(getOrCreateSession);

// Phase 8: Route GET /chat
app.get('/chat', async (req, res) => {
  try {
    const { q, provider } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Parameter "q" is required' });
    }

    // Changer de provider si demandé
    if (provider) {
      if (!PROVIDERS[provider]) {
        return res.status(400).json({ error: `Provider '${provider}' not found` });
      }
      req.session.setProvider(provider);
    }

    const result = await req.session.chat(q);
    const currentProvider = req.session.currentProvider;

    res.json({
      reply: result.response,
      provider: currentProvider,
      tokens: result.metrics.totalTokens
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Phase 8: Route DELETE /history
app.delete('/history', (req, res) => {
  try {
    req.session.clearHistory();
    res.json({ success: true, message: 'History cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route GET /metrics
app.get('/metrics', (req, res) => {
  try {
    res.json({
      sessionMetrics: req.session.getMetrics(),
      clientId: req.clientId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route GET /history
app.get('/history', (req, res) => {
  try {
    const history = req.session.getHistory();
    res.json({
      history: history,
      count: history.length,
      clientId: req.clientId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route GET /providers
app.get('/providers', (req, res) => {
  try {
    const providers = Object.keys(PROVIDERS).map(key => ({
      name: key,
      displayName: PROVIDERS[key].name
    }));
    res.json({ providers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Phase 9: Route GET /export/pdf
app.get('/export/pdf', (req, res) => {
  try {
    const stats = req.session.getStatistics();

    // Créer un PDF
    const doc = new PDFDocument({ bufferPages: true });
    const filename = `chatbot-stats-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Piping le PDF directement dans la réponse
    doc.pipe(res);

    // Titre
    doc.fontSize(20).font('Helvetica-Bold').text('📊 Rapport Statistiques Chatbot', 50, 50);
    doc.fontSize(10).font('Helvetica').text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 50, 80);
    doc.fontSize(10).text(`Durée session: ${Math.round(stats.sessionDuration / 1000)}s`, 50, 95);

    // Section 1: Résumé Global
    doc.fontSize(14).font('Helvetica-Bold').text('\n📈 Résumé Global', 50, 130);
    doc.moveTo(50, 150).lineTo(550, 150).stroke();

    const summaryData = [
      { label: 'Total Requests:', value: stats.totalRequests },
      { label: 'Total Tokens:', value: stats.totalTokens.toLocaleString('fr-FR') },
      { label: 'Coût Total:', value: `$${stats.totalCost.toFixed(6)}` },
      { label: 'Tokens/Request (avg):', value: stats.avgTokensPerRequest.toLocaleString('fr-FR') },
      { label: 'Coût/Request (avg):', value: `$${stats.avgCostPerRequest.toFixed(8)}` },
      { label: 'Durée/Request (avg):', value: `${stats.avgDuration}ms` },
      { label: 'Provider Actif:', value: PROVIDERS[stats.currentProvider].name }
    ];

    let yPos = 170;
    summaryData.forEach(item => {
      doc.fontSize(11).font('Helvetica-Bold').text(item.label, 50, yPos);
      doc.fontSize(11).font('Helvetica').text(item.value, 250, yPos);
      yPos += 20;
    });

    // Section 2: Historique des Requests
    if (stats.requestHistory.length > 0) {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('📝 Historique des Requests', 50, 50);
      doc.moveTo(50, 70).lineTo(550, 70).stroke();

      let requestYPos = 90;
      stats.requestHistory.forEach((req, idx) => {
        // Vérifier si on doit ajouter une nouvelle page
        if (requestYPos > 700) {
          doc.addPage();
          requestYPos = 50;
        }

        // En-tête du request
        doc.fontSize(10).font('Helvetica-Bold')
          .text(`Request #${req.requestNumber} - ${new Date(req.timestamp).toLocaleTimeString('fr-FR')}`, 50, requestYPos);
        
        requestYPos += 16;

        // Contenu du request (truncaté)
        const userMsg = req.userMessage.substring(0, 60) + (req.userMessage.length > 60 ? '...' : '');
        doc.fontSize(9).font('Helvetica')
          .text(`Q: ${userMsg}`, 60, requestYPos, { width: 450 });

        requestYPos += 16;

        // Métriques du request
        doc.fontSize(8).font('Helvetica').fillColor('#666666')
          .text(`Tokens: ${req.totalTokens} | Coût: $${req.cost.toFixed(8)} | Durée: ${req.duration}ms | Provider: ${PROVIDERS[req.provider].name}`, 60, requestYPos);

        requestYPos += 20;
        doc.fillColor('black');

        // Ligne de séparation
        if (idx < stats.requestHistory.length - 1) {
          doc.moveTo(50, requestYPos).lineTo(550, requestYPos).stroke('#CCCCCC');
          requestYPos += 8;
        }
      });
    }

    // Finalize PDF
    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`\n🚀 Chatbot API - Phase 8 + Phase 9`);
  console.log(`📍 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`\n📚 Routes disponibles:`);
  console.log(`  GET  /chat?q=...&provider=mistral&client_id=...  - Envoyer un message`);
  console.log(`  GET  /history?client_id=...                      - Voir l'historique`);
  console.log(`  GET  /metrics?client_id=...                      - Voir les métriques`);
  console.log(`  GET  /providers                                   - Lister les providers`);
  console.log(`  GET  /export/pdf?client_id=...                   - Exporter stats en PDF (Phase 9)`);
  console.log(`  DELETE /history?client_id=...                    - Effacer l'historique`);
  console.log(`  GET  /health                                      - Health check\n`);
});
