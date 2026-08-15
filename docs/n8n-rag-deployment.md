# Déploiement du workflow n8n RAG

Le fichier versionné [`LexmanageRAG.json`](../LexmanageRAG.json) contient les webhooks de chat, d’ingestion et de suppression documentaire.

## Variables n8n obligatoires

- `N8N_WEBHOOK_SECRET` : secret partagé avec le backend LexManage ;
- `PINECONE_API_KEY` : clé de l’index vectoriel ;
- `PINECONE_INDEX_HOST` : hôte HTTPS de l’index Pinecone, sans chemin final.

Le même `N8N_WEBHOOK_SECRET` doit être configuré sur Render. Il est envoyé dans l’en-tête `Authorization: Bearer …`.

## Mise en production

1. Importer à nouveau `LexmanageRAG.json` dans n8n.
2. Configurer les trois variables dans l’environnement n8n.
3. Reconnecter les credentials Gemini/Pinecone si n8n le demande.
4. Activer le workflow.
5. Copier les URL de production des webhooks dans les variables Render correspondantes.
6. Tester un chat, l’ingestion d’un PDF, puis sa suppression.

Les webhooks rejettent les appels sans secret valide. La mémoire de conversation est isolée par cabinet, utilisateur et session.
