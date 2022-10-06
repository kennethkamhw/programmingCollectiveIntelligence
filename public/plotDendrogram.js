// set the dimensions and margins of the graph
const width = 460
const height = 460

// append the svg object to the body of the page
const svg = d3.select("#chart-div")
  .append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(40,0)");  // bit of margin on the left = 40

// read json data
d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_dendrogram.json").then( function(data) {
console.log(data);
  // Create the cluster layout:
  const cluster = d3.cluster()
    .size([height, width - 100]);  // 100 is the margin I will have on the right side

  // Give the data to this cluster layout:
  const root = d3.hierarchy(data, function(d) {
      return d.children;
  });
  cluster(root);


  // Add the links between nodes:
  svg.selectAll('path')
    .data( root.descendants().slice(1) )
    .join('path')
    .attr("d", function(d) {
        return "M" + d.y + "," + d.x
                + "C" + (d.parent.y + 50) + "," + d.x
                + " " + (d.parent.y + 150) + "," + d.parent.x // 50 and 150 are coordinates of inflexion, play with it to change links shape
                + " " + d.parent.y + "," + d.parent.x;
              })
    .style("fill", 'none')
    .attr("stroke", '#ccc')


  // Add a circle for each node.
  const circles = svg.selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", function(d) {
          return `translate(${d.y},${d.x})`
      })
  const circle = circles.append("circle")
        .attr("r", 7)
        .style("fill", "#69b3a2")
        .attr("stroke", "black")
        .style("stroke-width", 2)
   const tag =   circles.append("text")
        .attr("dy", ".35em")
        .text(function(d) {
            console.log(d.data.name) 
            return d.data.name; 
        });

})