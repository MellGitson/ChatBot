import PDFDocument from 'pdfkit';
import { PROVIDERS } from './chatbot-core.js';
import fs from 'fs';

/**
 * Génère un PDF avec les statistiques de la session
 * @param {Object} stats - Objet statistiques (getStatistics())
 * @param {string|Stream} output - Chemin fichier ou stream de sortie
 * @returns {Promise<void>}
 */
export async function exportStatisticsPDF(stats, output) {
  return new Promise((resolve, reject) => {
    try {
      // Créer un PDF avec dimensions standard
      const doc = new PDFDocument({ 
        bufferPages: true,
        margin: 40,
        size: 'A4'
      });

      // Déterminer si output est un chemin (string) ou un stream
      let stream;
      if (typeof output === 'string') {
        stream = fs.createWriteStream(output);
      } else {
        stream = output;
      }

      doc.pipe(stream);

      // ============= PAGE 1: COUVERTURE ET RÉSUMÉ =============
      
      // Couleur de thème
      const primaryColor = '#2563EB';
      const accentColor = '#10B981';
      const lightBg = '#F3F4F6';

      // En-tête coloré
      doc.rect(0, 0, 612, 120).fill(primaryColor);
      doc.fontSize(32).font('Helvetica-Bold').fillColor('white')
        .text('Rapport Analytique Chatbot', 40, 30);
      doc.fontSize(11).font('Helvetica').fillColor(accentColor)
        .text('Analyse detaillee des Tokens et Couts', 40, 70);

      // Info session
      doc.fontSize(10).font('Helvetica').fillColor('white')
        .text(`Genere le: ${new Date().toLocaleString('fr-FR')}  |  Duree: ${Math.round(stats.sessionDuration / 1000)}s`, 40, 95);

      // Résumé Global - Cartes
      doc.fillColor('black');
      let cardYPos = 140;

      // Données pour les cartes
      const cards = [
        { 
          title: 'TOTAL REQUETES',
          value: stats.totalRequests.toString(),
          unit: 'requetes',
          color: '#3B82F6'
        },
        { 
          title: 'TOTAL TOKENS',
          value: stats.totalTokens.toLocaleString('fr-FR'),
          unit: 'tokens',
          color: '#8B5CF6'
        },
        { 
          title: 'COUT SESSION',
          value: `$${stats.totalCost.toFixed(6)}`,
          unit: 'USD',
          color: '#EC4899'
        },
        { 
          title: 'DUREE MOYENNE',
          value: `${stats.avgDuration}`,
          unit: 'ms',
          color: '#F59E0B'
        }
      ];

      // Dessiner 4 cartes (2x2)
      for (let i = 0; i < cards.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 40 + col * 280;
        const y = cardYPos + row * 85;

        // Carte blanche avec bordure
        doc.rect(x, y, 260, 75).fillAndStroke('white', '#E5E7EB');

        // Barre de couleur en haut
        doc.rect(x, y, 260, 4).fill(cards[i].color);

        // Titre
        doc.fontSize(9).font('Helvetica-Bold').fillColor(cards[i].color)
          .text(cards[i].title, x + 20, y + 12);

        // Valeur principale
        doc.fontSize(20).font('Helvetica-Bold').fillColor(cards[i].color)
          .text(cards[i].value, x + 20, y + 28);

        // Unité
        doc.fontSize(8).font('Helvetica').fillColor('#6B7280')
          .text(cards[i].unit, x + 20, y + 55);
      }

      // Section de détails
      cardYPos += 180;
      doc.fontSize(13).font('Helvetica-Bold').fillColor(primaryColor)
        .text('PERFORMANCE SESSION', 40, cardYPos);
      
      doc.moveTo(40, cardYPos + 18).lineTo(570, cardYPos + 18).stroke(primaryColor);

      // Tableau des métriques
      const detailMetrics = [
        ['Tokens moyens par requete', `${stats.avgTokensPerRequest}`],
        ['Cout moyen par requete', `$${stats.avgCostPerRequest.toFixed(8)}`],
        ['Provider actif', PROVIDERS[stats.currentProvider].name],
        ['Duree totale session', `${Math.round(stats.totalDuration / 1000)}s`]
      ];

      let metricsY = cardYPos + 35;
      detailMetrics.forEach((metric, idx) => {
        // Ligne alternée
        if (idx % 2 === 0) {
          doc.rect(40, metricsY - 5, 530, 25).fill(lightBg);
        }

        doc.fontSize(11).font('Helvetica-Bold').fillColor('black')
          .text(metric[0], 50, metricsY);
        doc.fontSize(11).font('Helvetica').fillColor(accentColor)
          .text(metric[1], 450, metricsY);

        metricsY += 28;
      });

      // ============= PAGE 2+: HISTORIQUE DÉTAILLÉ =============
      if (stats.requestHistory.length > 0) {
        doc.addPage();

        // En-tête de page
        doc.fontSize(13).font('Helvetica-Bold').fillColor(primaryColor)
          .text('HISTORIQUE DES REQUETES', 40, 40);
        doc.moveTo(40, 58).lineTo(570, 58).stroke(primaryColor);

        let logYPos = 75;
        let currentPage = 1;

        stats.requestHistory.forEach((req, idx) => {
          // Nouvelle page si nécessaire
          if (logYPos > 720) {
            doc.addPage();
            currentPage++;
            doc.fontSize(10).font('Helvetica').fillColor('#999999')
              .text(`Page ${currentPage}`, 40, 30);
            logYPos = 60;
          }

          // Container de request
          doc.rect(40, logYPos - 3, 530, 68).stroke('#E5E7EB');
          doc.rect(40, logYPos - 3, 8, 68).fill(accentColor);

          // Numéro et timestamp
          doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor)
            .text(`Requete #${req.requestNumber}`, 58, logYPos);
          
          doc.fontSize(8).font('Helvetica').fillColor('#6B7280')
            .text(new Date(req.timestamp).toLocaleString('fr-FR'), 130, logYPos);

          // Message utilisateur
          const displayMsg = req.userMessage.substring(0, 70) + 
            (req.userMessage.length > 70 ? '...' : '');
          doc.fontSize(9).font('Helvetica').fillColor('black')
            .text(`Question: ${displayMsg}`, 58, logYPos + 16, { width: 450 });

          // Badges de métriques
          const badges = [
            { label: `${req.totalTokens} tokens`, x: 58 },
            { label: `$${req.cost.toFixed(8)}`, x: 180 },
            { label: `${req.duration}ms`, x: 280 },
            { label: PROVIDERS[req.provider].name, x: 380 }
          ];

          doc.fontSize(7).font('Helvetica');
          badges.forEach(badge => {
            doc.rect(badge.x, logYPos + 38, 90, 15).stroke('#D1D5DB');
            doc.fillColor('#6366F1').text(badge.label, badge.x + 5, logYPos + 42, { width: 80 });
          });

          logYPos += 80;
        });

        // Pied de page avec stats finales
        doc.fontSize(9).font('Helvetica').fillColor('#999999')
          .text(`Total: ${stats.totalRequests} requetes | ${stats.totalTokens} tokens | $${stats.totalCost.toFixed(6)} cout`, 
            40, 750, { align: 'center' });
      }

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve();
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
}
