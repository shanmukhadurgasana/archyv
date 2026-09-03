import express from 'express';
const app = express();
app.get('/test', (req, res) => { res.json({ typeof: typeof req.query.isStarred, val: req.query.isStarred, eq: req.query.isStarred === 'true' }) });
const server = app.listen(5001, async () => { const r = await fetch('http://localhost:5001/test?isStarred=true'); console.log(await r.json()); server.close(); });
