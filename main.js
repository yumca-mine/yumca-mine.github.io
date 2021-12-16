window.addEventListener('load', init);
window.addEventListener('resize', resize);

var maxmapsize=2000000;
var fontsize=12;
var ctx=null;
var showmapid=false;
var showmapborder1_1=false;
var showmapborder1_16=false;
var search="";

var C_WIDTH=C_HEIGHT=0;

var image;
var image2;

var clickX=clickY="";

var decNX=decNY=0;
var drawdecX=drawdecY=0;
var ClickedList=[];

var SelClaim=null;

var moving=false;

var density=window.devicePixelRatio;
var tilecount=0;

drawdecY=700/density;
var zoom=0.15*density;

var octomap=[];
var octolist=[];
var octolimits=[0,0,0,0];
var octo18map=[];
var octo18list=[];
var octo18limits=[0,0,0,0];
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


function getOcto18mapTile(X,Z)
{
	if(octo18list.indexOf(X+","+Z)==-1)  return null;
	if(octo18map[X]==null) octo18map[X]=[];
	if(octo18map[X][Z]==null)
	{
		octo18map[X][Z]=new Image();
		octo18map[X][Z].src = "octomap18/map"+X+","+Z+".png";
		octo18map[X][Z].onload = function(){requestDraw();}
		return null;
	}
	return octo18map[X][Z];
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
var thisismobile=false;


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
	thisismobile=isMobile();
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

	urlParams = new URLSearchParams(new URL(this.location.href).search);
	
	if(urlParams.has('DX')) {var DX=urlParams.get('DX');drawdecX=DX/density;updatecoordinates();}
	if(urlParams.has('DZ')) {var DZ=urlParams.get('DZ');drawdecY=DZ/density;updatecoordinates();}
	if(urlParams.has('Z')) zoom=urlParams.get('Z');

	if(urlParams.has('showmapborder1_16')) showmapborder1_16=true;
	if(urlParams.has('showmapborder1_1')) showmapborder1_1=true;
	if(urlParams.has('q')) search=urlParams.get('q');	
	
	var P_fontsize=false;
	var P_overlay0=false;
	var P_overlay=false;
	var P_overlaytrim=false;
	var P_claims=true;
	var P_octomap=true;
	var P_octomap18=false;
	
	if(readCookie("C_fontsize")=="true") P_fontsize=true;
	if(readCookie("C_overlay0")=="true") P_overlay0=true;
	if(readCookie("C_overlay")=="true") P_overlay=true;
	if(readCookie("C_overlaytrim")=="true") P_overlaytrim=true;
	if(readCookie("C_claims")=="true") P_claims=true;
	if(readCookie("C_octomap")=="true")  P_octomap=true;
	if(readCookie("C_octomap18")=="true") P_octomap18=true;
	
	if(urlParams.has('P1')) {var P=urlParams.get('P1');if(P=="1") P_fontsize=true;if(P=="0") P_fontsize=false;}
	if(urlParams.has('P2')) {var P=urlParams.get('P2');if(P=="1") P_overlay0=true;if(P=="0") P_overlay0=false;}
	if(urlParams.has('P3')) {var P=urlParams.get('P3');if(P=="1") P_overlay=true;if(P=="0") P_overlay=false;}
	if(urlParams.has('P4')) {var P=urlParams.get('P4');if(P=="1") P_claims=true;if(P=="0") P_claims=false;}
	if(urlParams.has('P5')) {var P=urlParams.get('P5');if(P=="1") P_octomap=true;if(P=="0") P_octomap=false;}
	if(urlParams.has('P6')) {var P=urlParams.get('P6');if(P=="1") P_octomap18=true;if(P=="0") P_octomap18=false;}
	if(urlParams.has('P7')) {var P=urlParams.get('P7');if(P=="1") P_overlaytrim=true;if(P=="0") P_overlaytrim=false;}
	
	if(search!="") P_claims=true;
	
	document.getElementById("fontsize").checked=P_fontsize;
	document.getElementById("overlay0").checked=P_overlay0;
	document.getElementById("overlay").checked=P_overlay;
	document.getElementById("claims").checked=P_claims;
	document.getElementById("octomap").checked=P_octomap;
	document.getElementById("octomap18").checked=P_octomap18;
	document.getElementById("overlaytrim").checked=P_overlaytrim;
	
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
	
	
	octo18list.forEach(minmaxO18XZ);
	function minmaxO18XZ(value) {
	s=value.split(',');
	octo18limits[0]=Math.min(octo18limits[0],s[0]);
	octo18limits[1]=Math.max(octo18limits[1],s[0]);
	octo18limits[2]=Math.min(octo18limits[2],s[1]-1);
	octo18limits[3]=Math.max(octo18limits[3],s[1]-1);
	}
	
	fulllist.forEach(minmaxFXZ);
	function minmaxFXZ(value) {
	s=value.split(',');
	fulllimits[0]=Math.min(fulllimits[0],s[0]);
	fulllimits[1]=Math.max(fulllimits[1],s[0]);
	fulllimits[2]=Math.min(fulllimits[2],s[1]);
	fulllimits[3]=Math.max(fulllimits[3],s[1]);
	}
	


	ctx=c.getContext("2d");

	image = new Image();
	image2 = new Image();
	draw();
	image.onload=function(){requestDraw();}
	image2.onload=function(){requestDraw();}

}
//----------------------------------------------------------------------------------------
function OnKeyDown(event)
{
	if(event.keyCode==27) {emptyAllClickedList();draw();}
	if(event.keyCode==67) {centerselect();}//c
	if(event.keyCode==83) {selectcenter();}//s
	if(event.keyCode==106) {zoom=1;draw();}//*
	if(event.keyCode==109) {zoomout(1);}//-
	if(event.keyCode==107) {zoomin(1);}//+
	if(event.keyCode==37) {pan(-1,0);}//left
	if(event.keyCode==38) {pan(0,-1);}//up
	if(event.keyCode==39) {pan(1,0);}//right
	if(event.keyCode==40) {pan(0,1);}//bottom
}
//----------------------------------------------------------------------------------------
function Mapmousedown(event)
{
	if(event.type=="mousedown")
	{
		clickX=event.clientX;
		clickY=event.clientY;
		decNX=drawdecX;
		decNY=drawdecY;
	}
	if(event.type=="touchstart")
	{
		clickX=event.touches[0].clientX;
		clickY=event.touches[0].clientY;
		decNX=drawdecX;
		decNY=drawdecY;
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
		drawdecX=decNX-(clickX-CX)/zoom;
		drawdecY=decNY-(clickY-CY)/zoom;
		updatecoordinates();
		clearTimeout(drawtimeout);
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
		drawdecX=decNX-(clickX-CX)/zoom;
		drawdecY=decNY-(clickY-CY)/zoom;
		updatecoordinates();
		if(!thisismobile)
		draw();
		else
		requestTimedDraw(40);
	}
}

//----------------------------------------------------------------------------------------

function pan(X,Z)
{
		drawdecX=drawdecX-(X*200)/zoom;
		drawdecY=drawdecY-(Z*200)/zoom;
		updatecoordinates();
		draw();	
}

function changezoom(event)	{if(event.deltaY<0) {zoomin(1,event);} else {zoomout(1,event);}}
function zoomin(num,transmitedevent)		{
	
	if(transmitedevent!=undefined) //hacky way of centering the zoom on mouse cursor
	{
	var CLX=transmitedevent.clientX;
	var CLY=transmitedevent.clientY;
	var RCX=reversecalculateX(CLX*density);
	var RCY=reversecalculateY(CLY*density);
	}
	
	zoom*=Math.pow(1.1,num);
	
	if(transmitedevent!=undefined) //hacky way of centering the zoom on mouse cursor
	{
	var RCX2=reversecalculateX(CLX*density);
	var RCY2=reversecalculateY(CLY*density);
	drawdecX+=(RCX2-RCX)/density;
	drawdecY+=(RCY2-RCY)/density;
	}
	draw();

}
function zoomout(num,transmitedevent)		{
	
	if(transmitedevent!=undefined) //hacky way of centering the zoom on mouse cursor
	{
	var CLX=transmitedevent.clientX;
	var CLY=transmitedevent.clientY;
	var RCX=reversecalculateX(CLX*density);
	var RCY=reversecalculateY(CLY*density);
	}
	
	zoom/=Math.pow(1.1,num);
	
	if(transmitedevent!=undefined) //hacky way of centering the zoom on mouse cursor
	{
	var RCX2=reversecalculateX(CLX*density);
	var RCY2=reversecalculateY(CLY*density);
	drawdecX+=(RCX2-RCX)/density;
	drawdecY+=(RCY2-RCY)/density;
	}
	draw();
	
}
function emptyClickedList()	{while(ClickedList.length>1) {ClickedList.shift();updatecoordinates();} /*ClickedList=[];*/}
function emptyAllClickedList()	{ClickedList=[];updatecoordinates();}

//----------------------------------------------------------------------------------------
function distance(X1,X2,Z1,Z2) {return Math.sqrt(Math.pow(X1-X2,2)+Math.pow(Z1-Z2,2));}

//----------------------------------------------------------------------------------------
function selectCO() {ClickedList.push([1*document.getElementById("Xcoordsel").value,1*document.getElementById("Zcoordsel").value]);updatecoordinates();draw();}
function centerCO() {drawdecX=-1*document.getElementById("Xcoordcenter").value/density;drawdecY=-1*document.getElementById("Zcoordcenter").value/density;updatecoordinates();draw();}
function selectcenter() {ClickedList.push([1*document.getElementById("Xcoordcenter").value,1*document.getElementById("Zcoordcenter").value]);drawdecX=-1*document.getElementById("Xcoordcenter").value/density;drawdecY=-1*document.getElementById("Zcoordcenter").value/density;updatecoordinates();draw();}

function centerselect() {ClickedList.push([1*document.getElementById("Xcoordsel").value,1*document.getElementById("Zcoordsel").value]);drawdecX=-1*document.getElementById("Xcoordsel").value/density;drawdecY=-1*document.getElementById("Zcoordsel").value/density;updatecoordinates();draw();}

function updatecoordinates()
{
	 document.getElementById("Xcoordcenter").value=Math.round(drawdecX*density)*-1; document.getElementById("Zcoordcenter").value=Math.round(drawdecY*density)*-1;
	 if(ClickedList.length>0)
		{document.getElementById("Xcoordsel").value=ClickedList[ClickedList.length-1][0];document.getElementById("Zcoordsel").value=ClickedList[ClickedList.length-1][1];}
}

function hidecoordinateswindow() {document.getElementById("coordinateswindow").style.display="none";}
function showcoordinateswindow() {document.getElementById("coordinateswindow").style.display="block";}
function togglecoordinateswindow() {if(document.getElementById("coordinateswindow").style.display!="block") document.getElementById("coordinateswindow").style.display="block"; else document.getElementById("coordinateswindow").style.display="none";}

function filterclaim() {
var promptext = prompt("Filter claims", "");
if (promptext != null) {search=promptext;}	else	{search="";}
	document.location=permalink();
	return false;
}
function permalink()			{
	
	return "?DX="+Math.round(drawdecX*density)+"&DZ="+Math.round(drawdecY*density)+"&Z="+(Math.round(zoom*1000)/1000)+
	"&P1="+((document.getElementById("fontsize").checked) ? '1' : '0')+
	"&P2="+((document.getElementById("overlay0").checked) ? '1' : '0')+
	"&P3="+((document.getElementById("overlay").checked) ? '1' : '0')+
	"&P4="+((document.getElementById("claims").checked) ? '1' : '0')+
	"&P5="+((document.getElementById("octomap").checked) ? '1' : '0')+
	"&P6="+((document.getElementById("octomap18").checked) ? '1' : '0')+
	"&P7="+((document.getElementById("overlaytrim").checked) ? '1' : '0')+
	((showmapborder1_16) ? '&showmapborder1_16' : '')+
	((showmapborder1_1) ? '&showmapborder1_1': '')+
	((search!="") ? '&q='+search : '')
	
	 ;
	
}
function calculateX(val)		{return Math.floor((val+drawdecX*density)*zoom+C_WIDTH/2)-0.5;}
function reversecalculateX(val)	{return Math.floor((val-C_WIDTH/2)/zoom-drawdecX*density);}
function calculateY(val)		{return Math.floor((val+drawdecY*density)*zoom+C_HEIGHT/2)-0.5;}
function reversecalculateY(val)	{return Math.floor((val-C_HEIGHT/2)/zoom-drawdecY*density);}

function drawClaim(X,Z,X2,Z2,TEXT,CLAIMNUMBER,OWNER)
{	

	
	if(arguments.length == 1 || arguments.length == 2)
	{
		if(Z==undefined) Z=" number not added here";
		regex = /([-0-9]+)\ *([-0-9]+)\ *([-0-9]+)\ *([-0-9]+)\ *(.*)/;
		found = X.match(regex);
		if(found!=null)
		{
			drawClaim(parseInt(found[1]),parseInt(found[2]),parseInt(found[3]),parseInt(found[4]),found[5],Z,"");
		}
		else
		{
			console.log("invalid input");
		}
	}
	else if(arguments.length == 6 ||arguments.length == 7)
	{
		if(OWNER==undefined) OWNER="";
		if(search!="")
		{
		var notfound1=false;
		var notfound2=false;
		notfound1 = (TEXT.toLowerCase().search(search.toLowerCase())==-1);
		if(OWNER!="") notfound2 = (OWNER.toLowerCase().search(search.toLowerCase())==-1);
		
		if(notfound1 && notfound2) return
		}
	
		//swap coordinates if required
		if(X>X2){var temp = X;  X = X2;  X2 = temp;}
		if(Z>Z2){var temp = Z; Z = Z2;  Z2 = temp;}

		//if it's the selected claim, we don't draw it, we save the info in SelClaim so we can render it last (over the other one)
		var activeClaim=false;
		if(ClickedList.length>0 && ClickedList[ClickedList.length-1][0]>=X && ClickedList[ClickedList.length-1][0]<=X2 && ClickedList[ClickedList.length-1][1]>=Z && ClickedList[ClickedList.length-1][1]<=Z2)
		{
			activeClaim=true;
			if(SelClaim=="") {SelClaim=[X,Z,X2,Z2,TEXT,CLAIMNUMBER,OWNER]; return;}
		}
		
		// calculating width and height
		var W=Math.abs(X-X2)+1;
		var H=Math.abs(Z-Z2)+1;
		
		// setting up the colors
		var textcolor="rgb(0,0,0)";
		
		var activeborder="rgb(255, 193, 7)";
		var inactiveborder="rgb(255, 255, 255)";
		
		var claimfill="rgb(255,255,255,0.1)";
		
		var textbackcoord="rgb(255,255,255,0.5)";
		var textbackClaim="rgb(255,255,255,0.7)";
		
		
		if(activeClaim)
		{ctx.strokeStyle=activeborder;ctx.fillStyle=claimfill;}
		else
		{ctx.strokeStyle=inactiveborder;ctx.fillStyle=claimfill;}
		
		//the main rectangle of the claim
		ctx.beginPath();
		ctx.rect(Math.round(calculateX(X))-0.5, Math.round(calculateY(Z))-0.5, Math.round(calculateX(X2+1))-Math.round(calculateX(X)), Math.round(calculateY(Z2+1))-Math.round(calculateY(Z)));
		ctx.fill();
		ctx.stroke();
		
		//text(s) of the claim		
		if(activeClaim)
		{
			
			if(OWNER!=undefined) OWNER=" by "+OWNER; else OWNER="?";
			TEXT+=" [ Claim "+CLAIMNUMBER+" ]"+OWNER+" "+(Math.abs(X-X2)+1)*(Math.abs(Z-Z2)+1)+"m\u00B2";
			drawtext(calculateX(X)+ Math.floor(W*zoom/2),calculateY(Z),TEXT,"CENTER","TOP",textcolor,activeborder); //complete title of the claim
			if(zoom>0.25)
			{
			drawtext(calculateX(X),calculateY(Z),"X:"+X+" Z:"+Z,"RIGHT","BOTTOM",textcolor,textbackcoord); //top left coords
			drawtext(calculateX(X2),calculateY(Z2),"X:"+X2+" Z:"+Z2,"LEFT","TOP",textcolor,textbackcoord); // bottom right coords
			}
		}
		else
		{
			if(zoom>=0.15) drawtext(calculateX(X)+ Math.floor(W*zoom/2),calculateY(Z),TEXT,"CENTER","TOP",textcolor,textbackClaim); //short title	
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
function requestTimedDraw(time)
{
	if(drawtimeout==null)
	{
	drawtimeout=setTimeout(drawnooverlay,time);
	}
}

function drawnooverlay()
{
	draw(false);
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
						ctx.drawImage(im, Math.floor(calculateX(X*2048-64)),  Math.floor(calculateY(Z*2048-64)), Math.floor(calculateX((X+1)*2048-64))- Math.floor(calculateX(X*2048-64)),  Math.floor(calculateY((Z+1)*2048-64))- Math.floor(calculateY(Z*2048-64)));
						tilecount++;
					}
				}
				catch (err) {console.error(err,X,Z)}
				
				
			}
		} 
	}
	
//background layers
	if(document.getElementById("octomap18").checked)
	{
		var minXformap=Math.max(Math.floor((reversecalculateX(0)+64)/2048)-1,octo18limits[0]);
		var minZformap=Math.max(Math.floor((reversecalculateY(0)+64)/2048)-1,octo18limits[2]);
		var maxXformap=Math.min(Math.floor((reversecalculateX(C_WIDTH)+64)/2048)+1,octo18limits[1]);
		var maxZformap=Math.min(Math.floor((reversecalculateY(C_HEIGHT)+64)/2048)+1,octo18limits[3]);
		tilecount=0;
		for(var X=minXformap;X<=maxXformap;X++)
		{
			for(var Z=minZformap;Z<=maxZformap;Z++)
			{
				try
				{
					var im=getOcto18mapTile(X,Z+1);					
					if(im!=null)
					{
						
						ctx.drawImage(im, Math.floor(calculateX(X*2048-64)),  Math.floor(calculateY(Z*2048-64)), Math.floor(calculateX((X+1)*2048-64))- Math.floor(calculateX(X*2048-64)),  Math.floor(calculateY((Z+1)*2048-64))- Math.floor(calculateY(Z*2048-64)));
						tilecount++;
					}
				}
				catch (err) {console.error(err,X,Z)}
			}
		} 
	}
	

if((drawoverlay==true || !thisismobile))
{
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
						if(zoom>=0.2)
						{
						ctx.drawImage(getFullzoomTile(X,Z), Math.floor(calculateX(X*128-64)),  Math.floor(calculateY(Z*128-64)), Math.floor(calculateX((X+1)*128-64))- Math.floor(calculateX(X*128-64)),  Math.floor(calculateY((Z+1)*128-64))- Math.floor(calculateY(Z*128-64)));
						}
						else
						{
							ctx.fillStyle="rgba(255,255,255,0.3)";
							ctx.beginPath();
							ctx.rect( Math.floor(calculateX(X*128-64)),  Math.floor(calculateY(Z*128-64)), Math.floor(calculateX((X+1)*128-64))- Math.floor(calculateX(X*128-64)),  Math.floor(calculateY((Z+1)*128-64))- Math.floor(calculateY(Z*128-64)));
							ctx.fill();
						}
						tilecount++;
					}
				}
				catch (err) {console.error(err,X,Z)}
			}
		} 
	}

	try {
		if(document.getElementById("overlay").checked)
		{
			if(image.src=="") image.src = "s3_biome_map.png";
			ctx.drawImage(image, calculateX(-3584), calculateY(-3072),calculateX(4608+512)-calculateX(-3584), calculateY(1024+512)-calculateY(-3072));
		}
		if(document.getElementById("overlaytrim").checked)
		{
			/*
			if(image2.src=="") image2.src = "trim1.17.png";
			var scaleofthis=16;
			var SCRX=(-3432+24)*scaleofthis/2;
			var SCRY=(-1879+100)*scaleofthis/2;
			ctx.drawImage(image2, calculateX(SCRX), calculateY(SCRY),calculateX(SCRX+3432*scaleofthis)-calculateX(SCRX), calculateY(SCRY+1879*scaleofthis)-calculateY(SCRY));
			*/
			if(image2.src=="") image2.src = "trim1.18.png";
			var scaleofthis=9.96;
			var SCRX=(-2560+10)*scaleofthis/2;
			var SCRY=(-1440+204)*scaleofthis/2;
			ctx.drawImage(image2, calculateX(SCRX), calculateY(SCRY),calculateX(SCRX+2560*scaleofthis)-calculateX(SCRX), calculateY(SCRY+1440*scaleofthis)-calculateY(SCRY));
		}
	} 
	catch (err) {console.error(err)}

}


ctx.font = "bold "+(density*fontsize)+"px Arial";	
ctx.textAlign = 'center';

	if(showmapborder1_16 && zoom>0.03*density)
	{
		ctx.strokeStyle="rgb(213, 0, 249)";
		ctx.fillStyle="rgb(255, 255, 255)";
		var minXformap=Math.floor((reversecalculateX(0)+64)/2048)-1;
		var minZformap=Math.floor((reversecalculateY(0)+64)/2048)-1;
		var maxXformap=Math.floor((reversecalculateX(C_WIDTH)+64)/2048)+1;
		var maxZformap=Math.floor((reversecalculateY(C_HEIGHT)+64)/2048)+1;
		for(var X=minXformap;X<=maxXformap;X++)
		{
			for(var Z=minZformap;Z<=maxZformap;Z++)
			{
				ctx.beginPath();
				ctx.moveTo(Math.floor(calculateX(X*2048-64))-0.5,  Math.floor(calculateY(Z*2048-64))-0.5);
				ctx.lineTo(Math.floor(calculateX(X*2048-64))-0.5,  Math.floor(calculateY((Z+1)*2048-64))-0.5);
				ctx.lineTo(Math.floor(calculateX((X+1)*2048-64)-0.5),  Math.floor(calculateY((Z+1)*2048-64))-0.5);
				ctx.stroke();
				
				ctx.strokeText("map"+X+","+(Z+1)+".png",Math.floor(calculateX((X+0.5)*2048-64))-0.5,  Math.floor(calculateY((Z+0.5)*2048-64))-0.5);
				ctx.fillText("map"+X+","+(Z+1)+".png",Math.floor(calculateX((X+0.5)*2048-64))-0.5,  Math.floor(calculateY((Z+0.5)*2048-64))-0.5);
			}
		} 
		
	}
	
	if(showmapborder1_1 && zoom>0.8*density)
	{
		ctx.strokeStyle="rgb(213, 0, 249)";
		ctx.fillStyle="rgb(255, 255, 255)";
		var minXformap=Math.floor((reversecalculateX(0)+64)/128)-1;
		var minZformap=Math.floor((reversecalculateY(0)+64)/128)-1;
		var maxXformap=Math.floor((reversecalculateX(C_WIDTH)+64)/128)+1;
		var maxZformap=Math.floor((reversecalculateY(C_HEIGHT)+64)/128)+1;
		for(var X=minXformap;X<=maxXformap;X++)
		{
			for(var Z=minZformap;Z<=maxZformap;Z++)
			{
				ctx.beginPath();
				ctx.moveTo(Math.floor(calculateX(X*128-64))-0.5,  Math.floor(calculateY(Z*128-64))-0.5);
				ctx.lineTo(Math.floor(calculateX(X*128-64))-0.5,  Math.floor(calculateY((Z+1)*128-64))-0.5);
				ctx.lineTo(Math.floor(calculateX((X+1)*128-64)-0.5),  Math.floor(calculateY((Z+1)*128-64))-0.5);
				ctx.stroke();
				
				ctx.strokeText("map"+X+","+(Z)+".png",Math.floor(calculateX((X+0.5)*128-64))-0.5,  Math.floor(calculateY((Z+0.5)*128-64))-0.5);
				ctx.fillText("map"+X+","+(Z)+".png",Math.floor(calculateX((X+0.5)*128-64))-0.5,  Math.floor(calculateY((Z+0.5)*128-64))-0.5);
			}
		} 
		
	}

	
ctx.textAlign = 'left';
if(!showmapborder1_16 & !showmapborder1_1)
{
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
	drawSelectionLabel(ClickedList[ClickedList.length-1][0],ClickedList[ClickedList.length-1][1],"X:"+ClickedList[ClickedList.length-1][0]+" Z:"+ClickedList[ClickedList.length-1][1],"rgb(255,255,255)",selectioncolor);
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
	drawSelectionLabel(ClickedList[ClickedList.length-1][0],ClickedList[ClickedList.length-1][1],"X:"+ClickedList[ClickedList.length-1][0]+" Z:"+ClickedList[ClickedList.length-1][1],"rgb(255,255,255)",selectioncolor);
}
if(document.getElementById("action").value==0)
{
	drawSelectionLabel(ClickedList[ClickedList.length-1][0],ClickedList[ClickedList.length-1][1],"X:"+ClickedList[ClickedList.length-1][0]+" Z:"+ClickedList[ClickedList.length-1][1],"rgb(255,255,255)",selectioncolor);
	
	if(showmapid!== false)
	{
	console.log("octomap/map"+Math.floor((ClickedList[ClickedList.length-1][0]+64)/2048)+","+Math.floor((ClickedList[ClickedList.length-1][1]+64)/2048+1)+".png");
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
		
	drawSelectionLabel(ClickedList[i][0],ClickedList[i][1],"X:"+ClickedList[i][0]+" Z:"+ClickedList[i][1],"rgb(255,255,255)",selectioncolor);
	}
}


}



//-------------------------------------------- CLAIMS --------------------------------------------
SelClaim=null;
if(document.getElementById("claims").checked) DrawClaimData();
if(SelClaim!=null) drawClaim(SelClaim[0],SelClaim[1],SelClaim[2],SelClaim[3],SelClaim[4],SelClaim[5],SelClaim[6]); //calling once again draclaim to draw the selected one if it exists

}

function drawSelectionLabel(Xb,Zb,L,textcol,backcol)
{
var crosssize=5;
var X=Math.floor(calculateX(Xb));
var Z=Math.floor(calculateY(Zb));
var X2=Math.floor(calculateX(Xb+1));
var Z2=Math.floor(calculateY(Zb+1));
var Xc=Math.round((X+X2)/2);
var Zc=Math.round((Z+Z2)/2);

	if((X2-X)>(crosssize*2))
	{
		ctx.fillStyle=backcol;
		ctx.beginPath();
		ctx.rect(X,Z, X2-X, Z2-Z);
		ctx.fill();
	}
	else
	{
		ctx.strokeStyle=backcol;
		ctx.beginPath();
		ctx.moveTo(Xc-crosssize,Zc-crosssize);
		ctx.lineTo(Xc+crosssize,Zc+crosssize);
		ctx.stroke();	
		ctx.beginPath();
		ctx.moveTo(Xc+crosssize,Zc-crosssize);
		ctx.lineTo(Xc-crosssize,Zc+crosssize);
		ctx.stroke();
	}
	drawtext(Xc-0.5,Z-15.5,L,"CENTER","TOP",textcol,backcol);	
}
