require('./utils/ColorLogger')();
const { PORT } = require('./config');
require('./startup/eventEmitter')();
const app = require('./startup/app')();

app.listen(PORT, async () => {
    console.LogColor(console.color.FgCyan, `Server is running on PORT=${PORT} and worker=${process.pid}`);
    require('./startup/router')(app);
    require('./startup/selfHealing')();
    require('./startup/pgvector')();
});
