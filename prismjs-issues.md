Attempt #1 
Adding babel
Tried this, but it didn't work. Maybe would work in a review app?

https://github.com/TryGhost/gatsby-starter-ghost/issues/25

.babelrc:
{
    "presets": [
      [
        "babel-preset-gatsby"
      ]
    ],
    "plugins": [
      [
        "prismjs",
        {
          "languages": [
            "javascript",
            "typescript",
            "css",
            "html",
            "markup",
            "json",
            "handlebars",
            "yaml"
          ],
          "theme": "tomorrow",
          "css": true
        }
      ]
    ]
  }

  Attempt #2:
  https://www.gatsbyjs.org/packages/gatsby-remark-prismjs/?=gatsby-remark-embed

  -implemented but not working