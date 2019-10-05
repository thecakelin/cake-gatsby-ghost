import React from 'react'
import { graphql } from 'gatsby'
import { Layout } from '../components/common'
import * as d3 from 'd3';
import _ from 'lodash';

const width = 960,
  height = 500,
  radius = Math.min(width, height) / 2;

pack = data => d3.pack()
    .size([width - 2, height - 2])
    .padding(3)
  (d3.hierarchy({children: data})
    .sum(d => d.value))

const ProjectsPage = ({data}) => {
  const keywords = _.reduce(data.allNpmPackage.edges, 
    function(result, value, key) {
        value.node.keywords.forEach(keyword => {
            (result[keyword] || (result[keyword] = [])).push(value.node.name);
        })
        return result;
    }, {});

    // Remove gatsby and gatsby-plugin keywords
    delete keywords['gatsby'];
    delete keywords['gatsby-plugin'];

    // chart = {
    //     const root = pack(data);
        
    //     const svg = d3.create("svg")
    //         .attr("viewBox", [0, 0, width, height])
    //         .attr("font-size", 10)
    //         .attr("font-family", "sans-serif")
    //         .attr("text-anchor", "middle");
      
    //     const leaf = svg.selectAll("g")
    //       .data(root.leaves())
    //       .join("g")
    //         .attr("transform", d => `translate(${d.x + 1},${d.y + 1})`);
      
    //     leaf.append("circle")
    //         .attr("id", d => (d.leafUid = DOM.uid("leaf")).id)
    //         .attr("r", d => d.r)
    //         .attr("fill-opacity", 0.7)
    //         .attr("fill", d => color(d.data.group));
      
    //     leaf.append("clipPath")
    //         .attr("id", d => (d.clipUid = DOM.uid("clip")).id)
    //       .append("use")
    //         .attr("xlink:href", d => d.leafUid.href);
      
    //     leaf.append("text")
    //         .attr("clip-path", d => d.clipUid)
    //       .selectAll("tspan")
    //       .data(d => d.data.name.split(/(?=[A-Z][^A-Z])/g))
    //       .join("tspan")
    //         .attr("x", 0)
    //         .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
    //         .text(d => d);
      
    //     leaf.append("title")
    //         .text(d => `${d.data.title}\n${format(d.value)}`);
          
    //     return svg.node();
    //   }

    console.log(keywords);

    return (
        <Layout>
            <div ref="circles">
            </div>
        </Layout>
    )
}

export const query = graphql`
  query PluginsQuery {
    allNpmPackage {
        edges {
        node {
            id
            name
            title
            description
            created
            keywords
            humanDownloadsLast30Days
            readme {
            childMarkdownRemark {
                internal {
                    content
                }
                wordCount {
                    words
                }
            }
            }
            repository {
                url
                path
            }
        }
        }
    }
}
`

export default ProjectsPage