import { app } from './app.js';

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`GuzoMate backend server listening on port ${PORT}`);
});
