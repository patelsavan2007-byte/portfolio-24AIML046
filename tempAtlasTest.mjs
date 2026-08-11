import mongoose from "mongoose";
const uri = "mongodb+srv://patelsavan2007_db_user:Fa08OUZOgTYdlZzL@cluster0.nbnbold.mongodb.net/taskdb?retryWrites=true&w=majority&appName=Cluster0";
console.log("uri:", uri);

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("connected");
    return mongoose.disconnect();
  })
  .catch((err) => {
    console.error("error name:", err.name);
    console.error("error message:", err.message);
    console.error(err);
    process.exit(1);
  });