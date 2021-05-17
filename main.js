window.addEventListener('load', init);
window.addEventListener('resize', resize);

var maxmapsize=2000000;
var fontsize=12;
var ctx=null;
var showmapid=false;

var C_WIDTH=C_HEIGHT=0;

var image;

var clickX=clickY="";

var decX=decY=0;
var drawdecX=drawdecY=0;
var ClickedList=[];

var SelClaim=null;

var moving=false;

var density=window.devicePixelRatio;

var tilecount=0;

drawdecY=700/density;
decY=700/density;
var zoom=0.15*density;

var octomap=[];
var octolist=[];
var octolimits=[0,0,0,0];
var fullzoom=[];
var fulllist=[];
var fulllimits=[0,0,0,0];

function getOctomapTile(X,Z)
{
	if(octolist.indexOf(X+","+Z)==-1)  return null;
	if(octomap[X]==null) octomap[X]=[];
	if(octomap[X][Z]==null)
	{
		octomap[X][Z]=new Image();
		octomap[X][Z].src = "octomap/map"+X+","+Z+".png";
		octomap[X][Z].onload = function(){requestDraw();}
		return null;
	}
	return octomap[X][Z];
}

function getFullzoomTile(X,Z)
{
	if(fulllist.indexOf(X+","+Z)==-1)  return null;
	if(fullzoom[X]==null) fullzoom[X]=[];
	if(fullzoom[X][Z]==null)
	{
		fullzoom[X][Z]=new Image();
		fullzoom[X][Z].src = "fullzoom/map"+X+","+Z+".png";
		fullzoom[X][Z].onload = function(){requestDraw();}
		return null;
	}
	return fullzoom[X][Z];
}


function isMobile() {
   try{ document.createEvent("TouchEvent"); return true; }
   catch(e){ return false; }
}


function resize()	{initSize();draw();}


function writeCookie(cookieName,cookieValue)
{
	daysToExpire=100;
	var date = new Date();
	date.setTime(date.getTime()+(daysToExpire*24*60*60*1000));
	document.cookie = cookieName + "=" + cookieValue + "; expires=" + date.toGMTString()+";SameSite=Strict";
}
function readCookie(cookieName)
{
	var name = cookieName + "=";
	var allCookieArray = document.cookie.split(';');
	for(var i=0; i<allCookieArray.length; i++)
	{
	var temp = allCookieArray[i].trim();
	if (temp.indexOf(name)==0)
	return temp.substring(name.length,temp.length);
	}
	return null;
}

function initSize()
{
	var c=document.getElementById("canvas");
	C_WIDTH=c.clientWidth*density;
	C_HEIGHT=c.clientHeight*density;
	c.width  = C_WIDTH;
	c.height = C_HEIGHT;
}

function buttonvalueupdate(but)
{	
	var x = but.nextSibling.getElementsByClassName("optionspossible");
	for (var i = 0; i < x.length; i++) {
	x[i].style.display = "none";
	} 

	var x = but.nextSibling.getElementsByClassName("V"+but.value);
	for (var i = 0; i < x.length; i++) {
	x[i].style.display = "inline";
	} 
}

function init()
{
	var c=document.getElementById("canvas");

	document.addEventListener("keydown", OnKeyDown);
	c.addEventListener("wheel", changezoom);
	c.addEventListener("mouseup", Mapmouseup);
	c.addEventListener("mouseout", Mapmouseup);
	c.addEventListener("mousedown", Mapmousedown);
	c.addEventListener("mousemove", Mapmousemove);
	c.addEventListener("touchmove", Mapmousemove, false);
	c.addEventListener("touchstart", Mapmousedown, false);
	c.addEventListener("touchend", Mapmouseup, false);

	if(readCookie("C_fontsize")!=null) if(readCookie("C_fontsize")=="true") document.getElementById("fontsize").checked=true; else document.getElementById("fontsize").checked=false;
	if(readCookie("C_overlay0")!=null) if(readCookie("C_overlay0")=="true") document.getElementById("overlay0").checked=true; else document.getElementById("overlay0").checked=false;
	if(readCookie("C_overlay")!=null) if(readCookie("C_overlay")=="true") document.getElementById("overlay").checked=true; else document.getElementById("overlay").checked=false;
	if(readCookie("C_claims")!=null) if(readCookie("C_claims")=="true") document.getElementById("claims").checked=true; else document.getElementById("claims").checked=false;
	if(readCookie("C_octomap")!=null) if(readCookie("C_octomap")=="true") document.getElementById("octomap").checked=true; else document.getElementById("octomap").checked=false;
	
	if(readCookie("C_action")!=null) document.getElementById("action").value=readCookie("C_action"); else document.getElementById("action").value=0;
	buttonvalueupdate(document.getElementById("action"));
	
	if(fulllist.length==0) {
		document.getElementById("overlay0").nextSibling.style.lineHeight="0px";
		document.getElementById("overlay0").nextSibling.style.pointerEvents="none";
		document.getElementById("overlay0").nextSibling.style.opacity="0";
	}

	initSize();
	
	octolist.forEach(minmaxOXZ);
	function minmaxOXZ(value) {
	s=value.split(',');
	octolimits[0]=Math.min(octolimits[0],s[0]);
	octolimits[1]=Math.max(octolimits[1],s[0]);
	octolimits[2]=Math.min(octolimits[2],s[1]-1);
	octolimits[3]=Math.max(octolimits[3],s[1]-1);
	}
	
	fulllist.forEach(minmaxFXZ);
	function minmaxFXZ(value) {
	s=value.split(',');
	fulllimits[0]=Math.min(fulllimits[0],s[0]);
	fulllimits[1]=Math.max(fulllimits[1],s[0]);
	fulllimits[2]=Math.min(fulllimits[2],s[1]);
	fulllimits[3]=Math.max(fulllimits[3],s[1]);
	}

	var DX=getURLParameter("DX");
	if(DX!=null) {drawdecX=DX;decX=DX;updatecoordinates();}
	var DZ=getURLParameter("DZ");
	if(DZ!=null) {drawdecY=DZ;decY=DZ;updatecoordinates();}
	var Z=getURLParameter("Z");
	if(Z!=null) zoom=Z;

	ctx=c.getContext("2d");

	image = new Image();
	draw();

	image.src = "s3_biome_map.png";

}
//----------------------------------------------------------------------------------------
function OnKeyDown(event)
{
	if(event.keyCode==27) {emptyAllClickedList();draw();}
}
//----------------------------------------------------------------------------------------
function Mapmousedown(event)
{
	if(event.type=="mousedown")
	{
		clickX=event.clientX;
		clickY=event.clientY;
	}
	if(event.type=="touchstart")
	{
		clickX=event.touches[0].clientX;
		clickY=event.touches[0].clientY;
	}
}
//----------------------------------------------------------------------------------------
function Mapmouseup(event)
{
	if(event.type=="mouseup")
	{
		CX=event.clientX;
		CY=event.clientY;
	}
	if(event.type=="mouseout")
	{
		CX=event.clientX;
		CY=event.clientY;
	}
	if(event.type=="touchend")
	{
		CX=event.changedTouches[0].clientX;
		CY=event.changedTouches[0].clientY;
	}

	if(clickX!="" && clickY!="")
	{
	if(clickX!=CX || clickY!=CY)
	{
		drawdecX=decX-(clickX-CX)/zoom;
		drawdecY=decY-(clickY-CY)/zoom;
		decX=drawdecX;
		decY=drawdecY;
		updatecoordinates();
		draw();
	}
	
	
	if(!moving)
	{
		ClickedList.push([reversecalculateX(CX*density),reversecalculateY(CY*density)]);
		updatecoordinates();
		draw();
	}
	}
	
	clickX="";
	clickY="";
	moving=false;
}

//----------------------------------------------------------------------------------------
function Mapmousemove(event)
{
	var CX,CY;
	if(event.type=="mousemove")
	{
		CX=event.clientX;
		CY=event.clientY;
	}
	if(event.type=="touchmove")
	{
		CX=event.touches[0].clientX;
		CY=event.touches[0].clientY;
	}
	if(clickX!="")
	{
		moving=true;
		drawdecX=decX-(clickX-CX)/zoom;
		drawdecY=decY-(clickY-CY)/zoom;
		updatecoordinates();
		draw(false);
	}
}

//----------------------------------------------------------------------------------------
function changezoom(event)	{if(event.deltaY<0) {zoomin(1);} else {zoomout(1);}}
function zoomin(num)		{zoom*=Math.pow(1.1,num);draw();}
function zoomout(num)		{zoom/=Math.pow(1.1,num);draw();}
function emptyClickedList()	{while(ClickedList.length>1) {ClickedList.shift();updatecoordinates();} /*ClickedList=[];*/}
function emptyAllClickedList()	{ClickedList=[];updatecoordinates();}

//----------------------------------------------------------------------------------------
function distance(X1,X2,Z1,Z2) {return Math.sqrt(Math.pow(X1-X2,2)+Math.pow(Z1-Z2,2));}
function getURLParameter(name) {return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;}

//----------------------------------------------------------------------------------------
function selectCO() {ClickedList.push([1*document.getElementById("Xcoordsel").value,1*document.getElementById("Zcoordsel").value]);updatecoordinates();draw();}
function centerCO() {drawdecX=-1*document.getElementById("Xcoordcenter").value;decX=drawdecX;drawdecY=-1*document.getElementById("Zcoordcenter").value;decY=drawdecY;updatecoordinates();draw();}
function selectcenter() {ClickedList.push([1*document.getElementById("Xcoordcenter").value,1*document.getElementById("Zcoordcenter").value]);drawdecX=-1*document.getElementById("Xcoordcenter").value;decX=drawdecX;drawdecY=-1*document.getElementById("Zcoordcenter").value;decY=drawdecY;updatecoordinates();draw();}

function centerselect() {ClickedList.push([1*document.getElementById("Xcoordsel").value,1*document.getElementById("Zcoordsel").value]);drawdecX=-1*document.getElementById("Xcoordsel").value;decX=drawdecX;drawdecY=-1*document.getElementById("Zcoordsel").value;decY=drawdecY;updatecoordinates();draw();}

function updatecoordinates()
{
	 document.getElementById("Xcoordcenter").value=Math.round(drawdecX)*-1; document.getElementById("Zcoordcenter").value=Math.round(drawdecY)*-1;
	 if(ClickedList.length>0)
		{document.getElementById("Xcoordsel").value=ClickedList[ClickedList.length-1][0];document.getElementById("Zcoordsel").value=ClickedList[ClickedList.length-1][1];}
}

function hidecoordinateswindow() {document.getElementById("coordinateswindow").style.display="none";}
function showcoordinateswindow() {document.getElementById("coordinateswindow").style.display="block";}
function permalink()			{return "?DX="+Math.round(drawdecX)+"&DZ="+Math.round(drawdecY)+"&Z="+zoom;}
function calculateX(val)		{return Math.floor((val+drawdecX*density)*zoom+C_WIDTH/2)-0.5;}
function reversecalculateX(val)	{return Math.round((val-C_WIDTH/2)/zoom-drawdecX*density);}
function calculateY(val)		{return Math.floor((val+drawdecY*density)*zoom+C_HEIGHT/2)-0.5;}
function reversecalculateY(val)	{return Math.round((val-C_HEIGHT/2)/zoom-drawdecY*density);}

function drawClaim(X,Z,X2,Z2,TEXT,CLAIMNUMBER)
{
	if(arguments.length == 1 || arguments.length == 2)
	{
		if(Z==undefined) Z=" number not added here";
		regex = /([-0-9]+)\ *([-0-9]+)\ *([-0-9]+)\ *([-0-9]+)\ *(.*)/;
		found = X.match(regex);
		if(found!=null)
		{
			drawClaim(parseInt(found[1]),parseInt(found[2]),parseInt(found[3]),parseInt(found[4]),found[5],Z);
		}
		else
		{
			console.log("invalid input");
		}
	}
	else if(arguments.length == 6)
	{
		//swap coordinates if required
		if(X>X2){var temp = X;  X = X2;  X2 = temp;}
		if(Z>Z2){var temp = Z; Z = Z2;  Z2 = temp;}

		//if it's the selected claim, we don't draw it, we save the info in SelClaim so we can render it last (over the other one)
		var activeClaim=false;
		if(ClickedList.length>0 && ClickedList[ClickedList.length-1][0]>X && ClickedList[ClickedList.length-1][0]<X2 && ClickedList[ClickedList.length-1][1]>Z && ClickedList[ClickedList.length-1][1]<Z2)
		{
			activeClaim=true;
			if(SelClaim=="") {SelClaim=[X,Z,X2,Z2,TEXT,CLAIMNUMBER]; return;}
		}
		
		// calculating width and height
		var W=Math.abs(X-X2);
		var H=Math.abs(Z-Z2);
		
		// setting up the colors
		var textcolor="rgb(0,0,0)";
		
		var activeborder="rgb(255, 193, 7)";
		var inactiveborder="rgb(255, 255, 255)";
		
		var claimfill="rgb(255,255,255,0.3)";
		
		var textbackcoord="rgb(255,255,255,0.5)";
		var textbackClaim="rgb(255,255,255,0.7)";
		
		
		if(activeClaim)
		{ctx.strokeStyle=activeborder;ctx.fillStyle=claimfill;}
		else
		{ctx.strokeStyle=inactiveborder;ctx.fillStyle=claimfill;}
		
		//the main rectangle of the claim
		ctx.beginPath();
		ctx.rect(calculateX(X), calculateY(Z), Math.floor(W*zoom), Math.floor(H*zoom));
		ctx.fill();
		ctx.stroke();
		
		//text(s) of the claim		
		if(activeClaim)
		{
			TEXT+=" [ Claim "+CLAIMNUMBER+" ] "+Math.abs(X-X2)*Math.abs(Z-Z2)+"m\u00B2";
			drawtext(calculateX(X)+ Math.floor(W*zoom/2),calculateY(Z),TEXT,"CENTER","TOP",textcolor,activeborder); //complete title of the claim
			if(zoom>0.25)
			{
			drawtext(calculateX(X),calculateY(Z),"X:"+X+" Z:"+Z,"RIGHT","BOTTOM",textcolor,textbackcoord); //top left coords
			drawtext(calculateX(X2),calculateY(Z2),"X:"+X2+" Z:"+Z2,"LEFT","TOP",textcolor,textbackcoord); // bottom right coords
			}
		}
		else
		{
			drawtext(calculateX(X)+ Math.floor(W*zoom/2),calculateY(Z),TEXT,"CENTER","TOP",textcolor,textbackClaim); //short title	
		}
	}
}

function drawtext(X,Z,TEXT,Hpos,Vpos,fore,back) //display text over a rectangle
{
	var Wtext=Math.round(ctx.measureText(TEXT).width+10*density);
	var Hdec=Vdec=0;

	var Htext=fontsize+2;

	if(Hpos=="CENTER") Hdec-=Math.round(Wtext/2);
	if(Hpos=="RIGHT") Hdec-=Wtext;

	if(Vpos=="BOTTOM") Vdec+=Htext*density;
	if(Vpos=="MIDDLE") Vdec+=Htext/2*density;

	ctx.fillStyle=back;

	ctx.beginPath();
	ctx.rect(X+Hdec+0.5, Z-Htext*density-1*density+0.5+Vdec, Wtext,Htext*density);
	ctx.fill();

	ctx.fillStyle=fore;
	ctx.fillText(TEXT, X+Hdec+0.5+5*density, Z-3*density+0.5+Vdec);
}
var drawtimeout=null;
function requestDraw()
{
	if(drawtimeout==null)
	{
	drawtimeout=setTimeout(draw,50);
	}
}

function draw(drawoverlay) //main drawing function
{
drawtimeout=null;
document.getElementById('permalink').href=permalink();
if(document.getElementById("fontsize").checked) fontsize=16; else fontsize=12;

ctx.font = (density*fontsize)+"px Arial";	
	
//cleat canvas
ctx.clearRect(0, 0, C_WIDTH, C_HEIGHT);

if(drawoverlay==undefined) drawoverlay=true; //optional parameter (if false, the overlay is never drawn) enhance perfs on mobile while panning

//background layers
if(drawoverlay==true || !isMobile())
{
	if(document.getElementById("octomap").checked)
	{
		var minXformap=Math.max(Math.floor((reversecalculateX(0)+64)/2048)-1,octolimits[0]);
		var minZformap=Math.max(Math.floor((reversecalculateY(0)+64)/2048)-1,octolimits[2]);
		var maxXformap=Math.min(Math.floor((reversecalculateX(C_WIDTH)+64)/2048)+1,octolimits[1]);
		var maxZformap=Math.min(Math.floor((reversecalculateY(C_HEIGHT)+64)/2048)+1,octolimits[3]);
		
		tilecount=0;
		for(var X=minXformap;X<=maxXformap;X++)
		{
			for(var Z=minZformap;Z<=maxZformap;Z++)
			{
				try
				{
					var im=getOctomapTile(X,Z+1);					
					if(im!=null)
					{
						ctx.drawImage(getOctomapTile(X,Z+1), Math.floor(calculateX(X*2048-64)),  Math.floor(calculateY(Z*2048-64)), Math.floor(calculateX((X+1)*2048))- Math.floor(calculateX(X*2048))+1,  Math.floor(calculateY((Z+1)*2048))- Math.floor(calculateY(Z*2048))+1);
						tilecount++;
					}
				}
				catch (err) {console.error(err,X,Z)}
			}
		} 
	}
	
	if(document.getElementById("overlay0").checked)
	{
		
		
		var minXformap=Math.max(Math.floor((reversecalculateX(0)+64)/128)-1,fulllimits[0]);
		var minZformap=Math.max(Math.floor((reversecalculateY(0)+64)/128)-1,fulllimits[2]);
		var maxXformap=Math.min(Math.floor((reversecalculateX(C_WIDTH)+64)/128)+1,fulllimits[1]);
		var maxZformap=Math.min(Math.floor((reversecalculateY(C_HEIGHT)+64)/128)+1,fulllimits[3]);
				
		tilecount=0;
		for(var X=minXformap;X<=maxXformap;X++)
		{
			for(var Z=minZformap;Z<=maxZformap;Z++)
			{
				try
				{
					var im=getFullzoomTile(X,Z);					
					if(im!=null)
					{
						ctx.drawImage(getFullzoomTile(X,Z), Math.floor(calculateX(X*128-64)),  Math.floor(calculateY(Z*128-64)), Math.floor(calculateX((X+1)*128))- Math.floor(calculateX(X*128))+1,  Math.floor(calculateY((Z+1)*128))- Math.floor(calculateY(Z*128))+1);
						tilecount++;
					}
				}
				catch (err) {console.error(err,X,Z)}
			}
		} 
	}

	try {
		if(document.getElementById("overlay").checked)
			ctx.drawImage(image, calculateX(-3584), calculateY(-3072),calculateX(4608+512)-calculateX(-3584), calculateY(1024+512)-calculateY(-3072));
	} 
	catch (err) {console.error(err)}

}

ctx.font = "bold "+(density*fontsize)+"px Arial";	

//axes and grid
var step=100;
if(zoom<2*density) step=200;
if(zoom<1*density) step=500;
if(zoom<0.40*density) step=1000;
if(zoom<0.10*density) step=2000;
if(zoom<0.05*density) step=5000;
if(zoom<0.025*density) step=10000;
if(zoom<0.0125*density) step=50000;
for( var a=Math.round(-1*maxmapsize/step);a<=Math.round(1*maxmapsize/step);a++)
{
	if(calculateX(a*step)>0 && calculateX(a*step)<C_WIDTH)
	{
		if(a==0)
			{ctx.strokeStyle="rgba(233, 30, 99, 1)";}
		else
			{ctx.strokeStyle="rgba(255,255,255,0.3)";}
		ctx.beginPath();
		ctx.moveTo(Math.round(calculateX(a*step))-0.5,Math.round(calculateY(maxmapsize*-1))-0.5);
		ctx.lineTo(Math.round(calculateX(a*step))-0.5,Math.round(calculateY(maxmapsize))-0.5);
		ctx.stroke();
		
		
		ctx.strokeStyle="rgba(255,255,255,1)";
		ctx.fillStyle="rgba(40,40,40,1)";
		ctx.lineWidth = 3;
		if(calculateY(0)>0 && calculateY(0)<C_HEIGHT-fontsize*density)
		{
			var POX=calculateX(a*step);
			var POZ=calculateY(0)+fontsize*density;		
		}
		else if(calculateY(0)>C_HEIGHT-fontsize*density)
		{
			var POX=calculateX(a*step);
			var POZ=C_HEIGHT;
		}
		else
		{
			var POX=calculateX(a*step);
			var POZ=fontsize*density;
		}
		
		ctx.strokeText(((a*step)/1000)+"km", POX,POZ);
		ctx.fillText(((a*step)/1000)+"km", POX,POZ);
		ctx.lineWidth = 1;
	}
	
	if(calculateY(a*step)>0 && calculateY(a*step)<C_HEIGHT)
	{
		if(a==0)
			{ctx.strokeStyle="rgba(233, 30, 99, 1)";}
		else
			{ctx.strokeStyle="rgba(255,255,255,0.3)";}
		ctx.beginPath();
		ctx.moveTo(Math.round(calculateX(maxmapsize*-1))-0.5,Math.round(calculateY(a*step))-0.5);
		ctx.lineTo(Math.round(calculateX(maxmapsize))-0.5,Math.round(calculateY(a*step))-0.5);
		ctx.stroke();

		ctx.strokeStyle="rgba(255,255,255,1)";
		ctx.fillStyle="rgba(40,40,40,1)";
		ctx.lineWidth = 3;
		if(calculateX(0)>0 && calculateX(0)<C_WIDTH-fontsize*density)
		{
			var POX=calculateX(0);
			var POZ=calculateY(a*step)+fontsize*density;		
		}
		else if(calculateX(0)>C_WIDTH-fontsize*density)
		{
			var POX=C_WIDTH-50;
			var POZ=calculateY(a*step)+fontsize*density;
		}
		else
		{	
			var POX=0;
			var POZ=calculateY(a*step)+fontsize*density;
		}
		
		ctx.strokeText(((a*step)/1000)+"km", POX,POZ);
		ctx.fillText(((a*step)/1000)+"km", POX,POZ);
		ctx.lineWidth = 1;
	}
}

ctx.font = ""+(density*fontsize)+"px Arial";	

//-------------------------------------------- Clicked Coordinates --------------------------------------------
//rgba(213, 0, 249,1) //purple
//rgba(112, 158, 40, 1) // green ?
if(ClickedList.length>0)	{
var selectioncolor="rgba(233, 30, 99, 1)";
	
if(document.getElementById("action").value==3)
{
	var LX=	Math.round(calculateX(ClickedList[ClickedList.length-1][0]-50));
	var RX=	Math.round(calculateX(ClickedList[ClickedList.length-1][0]+50));
	var TY= 	Math.round(calculateY(ClickedList[ClickedList.length-1][1]-50));
	var BY=	Math.round(calculateY(ClickedList[ClickedList.length-1][1]+50));
	ctx.strokeStyle="rgba(255,255,255,1)";
	ctx.fillStyle="rgba(80,80,80,0.3)";
	ctx.beginPath();
	ctx.rect(LX-0.5,TY-0.5, RX-LX, BY-TY);
	ctx.fill();
	ctx.stroke();
	drawSelectionLabel(calculateX(ClickedList[ClickedList.length-1][0]),calculateY(ClickedList[ClickedList.length-1][1]),"X:"+ClickedList[ClickedList.length-1][0]+" Z:"+ClickedList[ClickedList.length-1][1],"rgb(255,255,255)",selectioncolor);
}
if(document.getElementById("action").value==2)
{
	var LX=	Math.round(calculateX(Math.floor(ClickedList[ClickedList.length-1][0]/16)*16-160));
	var RX=	Math.round(calculateX(Math.floor(ClickedList[ClickedList.length-1][0]/16)*16+176));
	var TY= Math.round(calculateY(Math.floor(ClickedList[ClickedList.length-1][1]/16)*16-160));
	var BY=	Math.round(calculateY(Math.floor(ClickedList[ClickedList.length-1][1]/16)*16+176));
	ctx.strokeStyle="rgba(255,255,255,1)";
	ctx.fillStyle="rgba(80,80,80,0.3)";
	ctx.beginPath();
	ctx.rect(LX-0.5,TY-0.5, RX-LX, BY-TY);
	ctx.fill();
	ctx.stroke();
	drawSelectionLabel(calculateX(ClickedList[ClickedList.length-1][0]),calculateY(ClickedList[ClickedList.length-1][1]),"X:"+ClickedList[ClickedList.length-1][0]+" Z:"+ClickedList[ClickedList.length-1][1],"rgb(255,255,255)",selectioncolor);
}
if(document.getElementById("action").value==0)
{
	drawSelectionLabel(calculateX(ClickedList[ClickedList.length-1][0]),calculateY(ClickedList[ClickedList.length-1][1]),"X:"+ClickedList[ClickedList.length-1][0]+" Z:"+ClickedList[ClickedList.length-1][1],"rgb(255,255,255)",selectioncolor);
	
	if(showmapid!== false)
	{
	console.log("octomap/map"+Math.floor((ClickedList[ClickedList.length-1][0]+64)/2048)+","+Math.floor((ClickedList[ClickedList.length-1][1]+64)/2018+1)+".png");
	
	console.log("fullzoom/map"+Math.floor((ClickedList[ClickedList.length-1][0]+64)/128)+","+Math.floor((ClickedList[ClickedList.length-1][1]+64)/128)+".png");
	}
}
if(document.getElementById("action").value==1)
{
	var totdist=0;
	for (let i = 0; i < ClickedList.length; i++) {
		
	if(i < ClickedList.length-1)
	{
			ctx.lineWidth = 3;
			ctx.strokeStyle="rgb(100, 181, 246)";
			ctx.beginPath();
			ctx.moveTo(calculateX(ClickedList[i][0]),calculateY(ClickedList[i][1]));
			ctx.lineTo(calculateX(ClickedList[i+1][0]),calculateY(ClickedList[i+1][1]));
			ctx.stroke();
			ctx.lineWidth = 1;
			var dist=distance(ClickedList[i][0],ClickedList[i+1][0],ClickedList[i][1],ClickedList[i+1][1]);
			totdist+=dist;
			drawtext((calculateX(ClickedList[i][0])+calculateX(ClickedList[i+1][0]))/2,(calculateY(ClickedList[i][1])+calculateY(ClickedList[i+1][1]))/2,Math.round(dist)+"m","CENTER","MIDDLE","rgb(255,255,255)","rgb(100, 181, 246)");
	}

	if(i == ClickedList.length-1 && i!=0)
	{
	drawtext(calculateX(ClickedList[i][0]),calculateY(ClickedList[i][1]),Math.round(totdist)+"m","CENTER","BOTTOM","rgb(255,255,255)","rgb(100, 181, 246)");
		
	}
		
	drawSelectionLabel(calculateX(ClickedList[i][0]),calculateY(ClickedList[i][1]),"X:"+ClickedList[i][0]+" Z:"+ClickedList[i][1],"rgb(255,255,255)",selectioncolor);
	}
}


}



//-------------------------------------------- CLAIMS --------------------------------------------
SelClaim="";
if(document.getElementById("claims").checked) DrawClaimData();
if(SelClaim!=null) drawClaim(SelClaim[0],SelClaim[1],SelClaim[2],SelClaim[3],SelClaim[4],SelClaim[5]); //calling once again draclaim to draw the selected one if it exists

}

function drawSelectionLabel(X,Z,L,textcol,backcol)
{
var crosssize=5;
			ctx.strokeStyle=backcol;
			ctx.beginPath();
			ctx.moveTo(X-crosssize,Z-crosssize);
			ctx.lineTo(X+crosssize,Z+crosssize);
			ctx.stroke();	
			ctx.beginPath();
			ctx.moveTo(X+crosssize,Z-crosssize);
			ctx.lineTo(X-crosssize,Z+crosssize);
			ctx.stroke();	

	drawtext(X,Z-15,L,"CENTER","TOP",textcol,backcol);	
	
}
