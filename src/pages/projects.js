import React from 'react'
import { graphql } from 'gatsby'
import { Layout } from '../components/common'
import * as d3 from 'd3';
import _ from 'lodash';

import '../styles/project-plugins.css';

// Children or offshoot plugins: @name/pluginX vs pluginX, how to display those?
// Plugin has external author to gatsby if @ in name

const margin = {top: 0, right: 50, bottom: 50, left: 100};

const outerWidth = 1400,
    outerHeight = 1400,
    width = outerWidth - margin.left - margin.right,
    height = outerHeight - margin.top - margin.bottom;

// These keywords match (almost) everything, removing to focus on the differences
// Oooo, can make this a user input filter
const FILTERED_KEYWORDS = ['gatsby', 'gatsby-plugin', 'gatsby-source-plugin', 'gatsby-theme'];

// If bubble sized is based on total downloads, or number of plugins for a keyword (with avg downloads for plugin size)
const BUBBLE_SIZE = "plugins";

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

const PackedBubbles = ({packedData, color}) => {
    return (
        <g transform={`translate(0,0)`}>
            {packedData.leaves().map(d => (
                <g transform={`translate(${d.x},${d.y})`}>
                    <Bubble 
                        className={"bubble-keyword"}
                        keyword={d.data.key} 
                        d={d} 
                        r={isNaN(d.r) ? 5 : d.r} 
                        x={0} 
                        y={0}
                        color={color}
                    />
                    {(packPlugins(d, isNaN(d.r) ? 5 : d.r * 2)).leaves().map(plugin => (      
                        <Bubble 
                            className={"bubble-plugin"}
                            keyword={plugin.data.plugin} 
                            d={plugin} 
                            r={isNaN(plugin.r) ? 5 : plugin.r} 
                            x={plugin.x - d.r} 
                            y={plugin.y - d.r}
                            color={color}
                        />
                    ))}
                </g>
            ))} 
        </g>
    )
}

const Bubble = ({ className, keyword, d, r, x, y, color }) => {
    // console.log(color);
    // console.log(d);
    // console.log(color(d.value));
    return (
        <g key={`bubble-container-${keyword}`} transform={`translate(${x || 0}, ${y || 0})`}>
            <circle
                className={`bubble ${className}`}
                key={`bubble-${keyword}`}
                cx={0}
                cy={0}
                r={r}
                fill={className === "bubble-keyword" ? color(d.data.value.stats.totalPlugins) : "white"}
            >
                <title>{keyword}</title>
            </circle>
            {(
                (className === "bubble-keyword" && r > 30) || 
                (className === "bubble-plugin" && r > 20)) ? (
                <text
                    className={`bubble-text ${className}`}
                    key={`bubble-text-${keyword}`}
                    x={0}
                    // Adjust keyword label up so it's not overlapping plugin labels
                    // Need an overlap mechanism for the plugins names
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

    const maxPlugins = d3.max(keywordsRolled, d => d.value.stats.totalPlugins);
    // const maxAvgDownloads = d3.max(keywordsRolled, d => d.value.stats.totalDownloads);
    // console.log("max plugin & avg dl:", maxPlugins, maxAvgDownloads);

    // const xScale = d3.scaleLinear().domain([0, maxPlugins]).range([0, width]);
    // const yScale = d3.scaleLinear().domain([0, maxAvgDownloads]).range([height, 0]);
    // console.log(packKeywords(keywordsRolled).leaves()[0]);
    // console.log(packPlugins(packKeywords(keywordsRolled).leaves()[0].value));
    
    const color = d3.scaleLinear()
        .domain([0, maxPlugins])
        .range(["#fff", "#362066"])
        .interpolate(d3.interpolateHcl);

    return (
        <Layout>
            {/* I could change this to be a Ghost blog entry I pull here, just might need to figure out where to turn it off on another route */}
            <div className="project-plugins-text-container">
                <h1 className="project-plugins-title">Gatsby Plugin Ecosystem</h1>
                <div className="project-plugins-subtitle">A Bubble Chart Story</div>
                <div className="project-plugins-overview-text">
                    Helllllo! Thanks for checking out this project! This is a fun visualization of all of Gatsby's plugins!
                    <br/><br/>
                    Code for page*:
                    <br/>
                    <a href="https://github.com/thecakelin/cake-gatsby-ghost/blob/projects/gatsby-plugins-d3/src/pages/projects.js">Github main project branch and main file</a>
                    <br/>
                    <a href="https://github.com/thecakelin/cake-gatsby-ghost/pull/1">Currently open pull request 2019-10-10</a>
                    <br/>
                    <a href="https://github.com/thecakelin/cake-gatsby-ghost/tree/master/src/pages/projects.js">After merging - main project file</a>
                    <br/><br/>
                    This uses the plugin gatsby-source-npm-package-search to pull all of Gatsby's plugins from NPM. GraphiQL makes selecting which fields you want a *breeze*.
                    Each of the plugins came with a list of keywords. I rolled it up so each keyword circle contains circles of all the plugins for that keyword.
                    The purple color is from the number of Gatsby plugins that exist for each keyword. The 1,337 Gatsby plugins (2019-10-11) have 1,196 plugin keywords.
                    Some of the main keywords (like "gatsby-source-plugin") are filtered out, so that the differences in other ones can stand out more.
                    This could be it's own feature, a user could click on a bubble in the vizualization, a legend item or enter text to have that keyword group disappear.
                    <br/><br/>
                    I built this to understand the direction that Gatsby is headed or potential plugin needs the community might have.
                    It's also for me to use as I pull all of my data out of different software that I use. I've written some glue code that pulls
                    my logins out of a password manager. The ability to search for a plugin (or use gatsby-source-custom-api!) to match these data sources 
                    means Gatsby is taking care of the hard parts and leaving the fun of exploring all my data to me.
                    The content mesh is here for the taking y'allll. As a scientist and full stack developer, I am absolutely digging it.
                    <br/><br/>
                    I'm still working on #a11y for this. Debating between a standard table and trying to build something that would 
                    pick out the most visually important pieces of the chart and convert them into a text description.
                    Accessible charts should have easy to understand captions, but I'd like to see it go farther. 
                    <br/><br/>
                    The clear winners for keywords below are "remark", "markdown", "react", "image", "plugin" and "gatsby-component". 
                    The react and plugin keyword bubbles are about a fifth the size of the remark and markdown bubbles.
                    Perhaps "plugin" is too generic and should join the filtered keywords list?
                    <br/><br/>
                    Another thing to notice is the amount of large keyword circles that are light pink (few plugins for that keyword).
                    These are popular needs that are dominated by only 1 or 2 plugins.
                    There are also some tiny bubbles in darker shades. It's possible those are from user variants of official Gatsby plugins, but they could be potential areas for new, useful plugins.
                    <br/><br/>
                    Getting D3 and React to play well together is tricky, because they both want to control the DOM. This gets even more difficult with events and transitions.
                    The last React and D3 setup I did was in Typescript. We built a component infrastructure which was complex.
                    Decided to try something new this time and do it in a more static site friendly way. Here's my main source:
                    <br/>
                    <a href="https://www.youtube.com/watch?v=Bdeu-BFisJU">Jason Lengstorf & Swizec Teller Youtube video (auto-generated captions) </a>
                    and <a href="https://github.com/jlengstorf/react-dataviz">the repo for that video</a>
                    <br/><br/>
                    A general shoutout to <a href="https://www.d3-graph-gallery.com">Yan Holtz's D3 resources and examples</a>. 
                    I haven't come across his site before and it's beautiful, concise and approachable.
                    <br/><br/>
                    Are you wondering why the keyword labels in the visualization are underneath the circles? That's because with SVG, whatever element is added last is on top.
                    Icing on the CAKE, if you will. :D

                    <br/><br/>* Interesting that linking to code for a project will have a different URL over time. I wonder which different solutions exist for that.
                </div>
            </div>
            <svg 
                className="project-plugins" 
                width={outerWidth} 
                height={outerHeight}
                // Looking for another way to do on/mouseover events that doesn't involve a ref
                // ref={ref => (this.svgRef = ref)}
            >
                <g transform={`translate(${margin.left},${margin.top})`}>
                    <PackedBubbles packedData={packKeywords(keywordsRolled)} color={color}/>
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