import React from 'react'
import { graphql } from 'gatsby'
import { Layout } from '../components/common'
import * as d3 from 'd3';
import _ from 'lodash';

import '../styles/project-plugins.css';

// Children or offshoot plugins: @name/pluginX vs pluginX, how to display those?
// Plugin has external author to gatsby if @ in name

const margin = {top: 50, right: 50, bottom: 50, left: 50};

const outerWidth = 1200,
    outerHeight = 1200,
    width = outerWidth - margin.left - margin.right,
    height = outerHeight - margin.top - margin.bottom;

// These keywords match (almost) everything, removing to focus on the differences
// Oooo, can make this a user input filter
const FILTERED_KEYWORDS = ['gatsby', 'gatsby-plugin', 'gatsby-source-plugin'];

// For packing circles of plugins inside a keyword circle
const packPlugins = (data, diameter) => d3.pack()
    .size([diameter - 2, diameter - 2])
    .padding(3)
    (d3.hierarchy({children: data.data.value.children})
    .sum(d => {
        if (d) {
            return d.downloads;
        }
    }));

const packKeywords = data => d3.pack()
    .size([width - 2, height - 2])
    .padding(3)
    (d3.hierarchy({children: data})
    .sum(d => {
        // Somehow it is appending a copy of the entire array in the last slot
        if (d.value) { 
            return d.value.stats.totalDownloads;
        }
    }));

const PackedBubbles = packedData => {
    return (
        <g transform={`translate(${cx}, ${cy})`}>
            {packedData.leaves().map(d => (
                <g transform={`translate(${d.x},${d.y})`}>
                    <Bubble 
                        className={"bubble-keyword"}
                        keyword={d.data.key} 
                        d={d} 
                        r={isNaN(d.r) ? 5 : d.r} 
                        x={0} 
                        y={0}
                    />
                    {(packPlugins(d, isNaN(d.r) ? 5 : d.r * 2)).leaves().map(plugin => (      
                        <Bubble 
                            className={"bubble-plugin"}
                            keyword={plugin.data.plugin} 
                            d={plugin} 
                            r={isNaN(plugin.r) ? 5 : plugin.r} 
                            x={plugin.x - d.r} 
                            y={plugin.y - d.r}
                        />
                    ))}
                </g>
            ))} 
        </g>
    )
}

const Bubble = ({ className, keyword, x, y, r }) => {
    return (
        <g key={`bubble-container-${keyword}`} transform={`translate(${x || 0}, ${y || 0})`}>
            <circle
                className={`bubble ${className}`}
                key={`bubble-${keyword}`}
                cx={0}
                cy={0}
                r={r}
            >
            <title>{keyword}</title>
            </circle>
            {(r > 30) ? (
                <text
                    className={`bubble-text ${className}`}
                    key={`bubble-text-${keyword}`}
                    x={0}
                    // Adjust keyword label up so it's not overlapping plugin labels
                    y={className === "bubble-keyword" ? -15 : 0}
                >
                    {keyword}
                </text>
            ) : null}
        </g>
    )
}

/**
 * 
 * @param {*} param0 
 */
const ProjectsPage = ({data}) => {
    // Ready, set... let's clean and format dis data!
    const keywords = _.reduce(data.allNpmPackage.edges, 
        (result, value) => {
            // Is this a child plugin? Does the child have more downloads?
            // if (value.node.name.charAt(0) === '@' && 
            //     _.findIndex(data.allNpmPackage.edges, node => {
            //         return node.name === value.node.name.split('/')[1]; // Hope this returns false if there is no /
            //     })) {
            //     }

            // Remove the too common keywords
            const filteredKeywords = _.filter(
                value.node.keywords, 
                (keyword) => !_.includes(FILTERED_KEYWORDS, keyword)
            );

            filteredKeywords.forEach(keyword => {
                (result[keyword] || (result[keyword] = [])).push(
                    {
                        "plugin": value.node.name, 
                        "downloads": value.node.downloadsLast30Days,
                        "keywords": filteredKeywords
                    });
            })
            return result;
        }, {});  
    // console.log(keywords);

    // Structure as {"key": "keyword", "value": ["plugin", "plugin"]}
    const keywordsValues = d3.map(keywords).entries();

    const keywordsRolled = d3.nest()
        .key(d => d.key)
        .rollup(v => {
            return {
                children: v[0].value,
                // Testing this as relationship for force diagram between keywords
                keywords: _.reduce(v[0].value, (result, value) => {
                    value.keywords.forEach(keyword => {
                        // Parent keyword value ends up in this list
                        // if (keyword !== d.key) {
                        result[keyword] ? result[keyword] += 1 : result[keyword] = 1;
                        // }
                    });
                    return result;
                }, {}),         
                stats: {
                    totalPlugins: v[0].value.length,
                    totalDownloads: d3.sum(v[0].value, d => {return d.downloads}),
                    avgDownloads: d3.mean(v[0].value, d => {return d.downloads}),
                }
            }})
        .entries(keywordsValues);

    console.log("rolled up yo", keywordsRolled);   

    // const maxPlugins = d3.max(keywordsRolled, d => d.value.stats.totalPlugins);
    // const maxAvgDownloads = d3.max(keywordsRolled, d => d.value.stats.avgDownloads);
    // console.log("max plugin & avg dl:", maxPlugins, maxAvgDownloads);

    // const xScale = d3.scaleLinear().domain([0, maxPlugins]).range([0, width]);
    // const yScale = d3.scaleLinear().domain([0, maxAvgDownloads]).range([height, 0]);
    // console.log(packKeywords(keywordsRolled).leaves()[0]);
    // console.log(packPlugins(packKeywords(keywordsRolled).leaves()[0].value));
    
    return (
        <Layout>
            <div className="overview-text">This is a fun visualization of all of Gatsby's plugins! Or it will be.</div>
            <svg 
                className="project-plugins" 
                width={outerWidth} 
                height={outerHeight}
                // Looking for another way to do on/mouseover events that doesn't involve a ref
                // ref={ref => (this.svgRef = ref)}
            >
                <g transform={`translate(${margin.left},${margin.top})`}>
                    <PackedBubbles packedData={packKeywords(keywordsRolled)}/>
                </g>
            </svg>
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
                downloadsLast30Days
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