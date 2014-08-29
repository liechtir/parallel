var width,height;
var topo,projection,path,svg,g,graticule,tooltip,zoom;


function initMap(){
	d3.select(window).on("resize", throttle);
	zoom = d3.behavior.zoom()
	    .scaleExtent([1, 50])
	    .on("zoom", move);
	width = document.getElementById('container').offsetWidth;
	height = width / 2;
	graticule = d3.geo.graticule();
	tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");
  	projection = d3.geo.mercator()
	    .translate([(width/2), (height/1.5)])
	    .scale( width / 2 / Math.PI);
  	path = d3.geo.path().projection(projection);

  svg = d3.select("#container").append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("id", "map")
      .call(zoom)
      .on("click", click)
      .append("g");

  g = svg.append("g");
  draw(topo);
  jQuery(function($){
	    $('path').click(function(){
	        $('#Iceland').hide();
	        $('#UnitedStates').hide();
	        $('#France').hide();
	        
	        var clickedCountry = this.getAttribute("title");
	        clickedCountry = clickedCountry.replace(/\s+/g, '');
	        $("#"+clickedCountry).fadeIn(750);
	    });
  });
}

d3.json("resources/d3map/data/world-topo-no-antarctica-min.json", function(error, world) {
  var countries = topojson.feature(world, world.objects.countries).features;
  topo = countries;
});

function draw(topo) {
  svg.append("path")
     .datum(graticule)
     .attr("class", "graticule")
     .attr("d", path);


  g.append("path")
   .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
   .attr("class", "equator")
   .attr("d", path);


  var country = g.selectAll(".country").data(topo);

  country.enter().insert("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("id", function(d,i) { return d.id; })
      .attr("title", function(d,i) { return d.properties.name; })
      .style("fill", function(d, i) { return d.properties.color; });

  //offsets for tooltips
  var offsetL = document.getElementById('container').offsetLeft+20;
  var offsetT = document.getElementById('container').offsetTop+10;

  //tooltips
  country
    .on("mousemove", function(d,i) {

      var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );

      tooltip.classed("hidden", false)
             .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
             .html(d.properties.name);

      })
      .on("mouseout",  function(d,i) {
        tooltip.classed("hidden", true);
      }); 


  //EXAMPLE: adding some capitals from external CSV file
  d3.csv("resources/d3map/data/country-capitals.csv", function(err, capitals) {

    capitals.forEach(function(i){
      // doesnt work properly yet addpoint(i.CapitalLongitude, i.CapitalLatitude, i.CapitalName );
    });

  });

}


function redraw() {
  width = document.getElementById('container').offsetWidth;
  height = width / 2;
  d3.select('svg').remove();
  initMap();
}


function move() {
  var t = d3.event.translate;
  var s = d3.event.scale; 
  zscale = s;
  var h = height/4;


  t[0] = Math.min(
    (width/height)  * (s - 1), 
    Math.max( width * (1 - s), t[0] )
  );

  t[1] = Math.min(
    h * (s - 1) + h * s, 
    Math.max(height  * (1 - s) - h * s, t[1])
  );

  zoom.translate(t);
  g.attr("transform", "translate(" + t + ")scale(" + s + ")");

  //adjust the country hover stroke width based on zoom level
  d3.selectAll(".country").style("stroke-width", 1 / s);
}



var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
      redraw();
    }, 200);
}


//geo translation on mouse click in map
function click() {
  var latlon = projection.invert(d3.mouse(this));
  console.log(latlon);
}


//function to add points and text to the map (used in plotting capitals)
function addpoint(lat,lon,text) {

  var gpoint = g.append("g").attr("class", "gpoint");
  var x = projection([lat,lon])[0];
  var y = projection([lat,lon])[1];
  if(isNaN(x) || isNaN(y)){
  	return;
  }

  gpoint.append("svg:circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("class","point")
        .attr("r", 1.5);

  //conditional in case a point has no associated text
  if(text.length>0){

    gpoint.append("text")
          .attr("x", x+2)
          .attr("y", y+2)
          .attr("class","text")
          .text(text);
  }

}

function isolateCountry(id){
	$('path').not(document.getElementById(id)).fadeOut(750);
	var scale,translate;
	var a = path.bounds(document.getElementById(id));
	var bounds = a,
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .9 / Math.max(dx / width, dy / height),
      translate = [width / 2 - scale * x, height / 2 - scale * y];

  svg.transition()
      .duration(750)
      .call(zoom.translate(translate).scale(scale).event);
}

