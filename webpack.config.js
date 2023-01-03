module.exports = {
  mode: "development",
  entry: "./src/index.js",
  devServer: {
    static: "./dist"
  },
  output: {
    filename: "o3o.js"
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        use: ["html-loader"]
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      }
    ]
  }
};
