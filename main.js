window.addEventListener('load', init);
window.addEventListener('resize', resize);

var maxmapsize=2000000;
var fontsize=12;
var ctx=null;

var C_WIDTH=C_HEIGHT=0;

var image;

var clickX=clickY="";

var decX=decY=0;
var drawdecX=drawdecY=0;
var ClickedList=[];

var SelClaim=null;

var moving=false;

var density=window.devicePixelRatio;

drawdecY=700/density;
decY=700/density;
var zoom=0.15*density;

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
	if(readCookie("C_clicktype")!=null) if(readCookie("C_clicktype")=="true") document.getElementById("distances").checked=true; else document.getElementById("distances").checked=false;

	initSize();

	ctx=c.getContext("2d");
	

	image = new Image();
	image2 = new Image();

	draw();

	image.src = "s3_biome_map.png";
	image.onload = function(){draw();}
	image2.src = "yumca.png";
	image2.onload = function(){draw();}

}
//----------------------------------------------------------------------------------------
function OnKeyDown(event)
{
	if(event.keyCode==27) {emptyClickedList();draw();}
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
		draw();
	}
	
	
	if(!moving)
	{
		ClickedList.push([reversecalculateX(CX*density),reversecalculateY(CY*density)]);
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
		draw(false);
	}
}

//----------------------------------------------------------------------------------------
function changezoom(event)	{if(event.deltaY<0) {zoomin(1);} else {zoomout(1);}}
function zoomin(num)		{zoom*=Math.pow(1.1,num);draw();}
function zoomout(num)		{zoom/=Math.pow(1.1,num);draw();}
function emptyClickedList()	{ClickedList=[];}

//----------------------------------------------------------------------------------------
function distance(X1,X2,Z1,Z2) {return Math.sqrt(Math.pow(X1-X2,2)+Math.pow(Z1-Z2,2));}

//----------------------------------------------------------------------------------------
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
		if(X>X2){var temp = X;  X = X2;  X2 = X;}
		if(Z>Z2){var temp = Z; Z = Z2;  Z2 = Z;}

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

function draw(drawoverlay) //main drawing function
{
if(document.getElementById("fontsize").checked) fontsize=16; else fontsize=12;

ctx.font = (density*fontsize)+"px Arial";	
	
//cleat canvas
ctx.clearRect(0, 0, C_WIDTH, C_HEIGHT);

if(drawoverlay==undefined) drawoverlay=true; //optional parameter (if false, the overlay is never drawn) enhance perfs on mobile while panning

//background image
if(drawoverlay==true || !isMobile())
{
    try {// Don't ask me why, but this try-catch block fixes everything on safari. 
        if(document.getElementById("overlay").checked) ctx.drawImage(image, calculateX(-3584), calculateY(-3072),calculateX(4608+512)-calculateX(-3584), calculateY(1024+512)-calculateY(-3072));
        if(document.getElementById("overlay0").checked) ctx.drawImage(image2, calculateX(448), calculateY(832+9*128),calculateX(448+9*128)-calculateX(448), calculateY(832-9*128)-calculateY(832));
		
	} 
    catch (err) {console.error(err)}
}
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
			{ctx.strokeStyle="rgba(80,80,80,1)";}
		else
			{ctx.strokeStyle="rgba(255,255,255,0.3)";}
		ctx.beginPath();
		ctx.moveTo(calculateX(a*step),calculateY(maxmapsize*-1));
		ctx.lineTo(calculateX(a*step),calculateY(maxmapsize));
		ctx.stroke();
		
		
		ctx.fillStyle="rgba(80,80,80,1)";
		if(calculateY(0)>0 && calculateY(0)<C_HEIGHT-fontsize)
		{
			ctx.fillText(((a*step)/1000)+"km", calculateX(a*step), calculateY(0)+fontsize);		
		}
		else if(calculateY(0)>C_HEIGHT-fontsize)
		{
			ctx.fillText(((a*step)/1000)+"km", calculateX(a*step), C_HEIGHT);
		}
		else
			ctx.fillText(((a*step)/1000)+"km", calculateX(a*step), fontsize);
	}
	
	if(calculateY(a*step)>0 && calculateY(a*step)<C_HEIGHT)
	{
		if(a==0)
			{ctx.strokeStyle="rgba(80,80,80,1)";}
		else
			{ctx.strokeStyle="rgba(255,255,255,0.3)";}
		ctx.beginPath();
		ctx.moveTo(calculateX(maxmapsize*-1),calculateY(a*step));
		ctx.lineTo(calculateX(maxmapsize),calculateY(a*step));
		ctx.stroke();
		if(calculateX(0)>0 && calculateX(0)<C_WIDTH-fontsize)
		{
			ctx.fillText(((a*step)/1000)+"km", calculateX(0), calculateY(a*step));		
		}
		else if(calculateX(0)>C_WIDTH-fontsize)
		{
			ctx.fillText(((a*step)/1000)+"km", C_WIDTH-50, calculateY(a*step));
		}
		else
			ctx.fillText(((a*step)/1000)+"km", 0, calculateY(a*step));
	}
}


//-------------------------------------------- Clicked Coordinates --------------------------------------------
if(ClickedList.length>0)	{
	
if(document.getElementById("distances").checked)
{
	drawtext(calculateX(ClickedList[ClickedList.length-1][0]),calculateY(ClickedList[ClickedList.length-1][1]),"X:"+ClickedList[ClickedList.length-1][0]+" Z:"+ClickedList[ClickedList.length-1][1],"CENTER","TOP","rgb(255,255,255)","rgba(112, 158, 40, 1)");
}
else
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
		
	drawtext(calculateX(ClickedList[i][0]),calculateY(ClickedList[i][1]),"X:"+ClickedList[i][0]+" Z:"+ClickedList[i][1],"CENTER","TOP","rgb(255,255,255)","rgba(112, 158, 40, 1)");
	}
}


}



//-------------------------------------------- CLAIMS --------------------------------------------
SelClaim="";
DrawClaimData();
if(SelClaim!=null) drawClaim(SelClaim[0],SelClaim[1],SelClaim[2],SelClaim[3],SelClaim[4],SelClaim[5]); //calling once again draclaim to draw the selected one if it exists

}
