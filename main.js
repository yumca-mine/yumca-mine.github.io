window.addEventListener('load', init);
window.addEventListener('resize', resize);

var maxmapsize=200000;
var fontsize=12;
var ctx=null;

var C_WIDTH=C_HEIGHT=0;

var image;

var clickX=clickY="";

var decX=decY=0;
var drawdecX=drawdecY=0;
var clickedX=clickedY="";

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

	initSize();

	ctx=c.getContext("2d");
	ctx.font = (density*fontsize)+"px Arial";

	image = new Image();

	draw();

	image.src = "s3_biome_map.png";
	image.onload = function(){draw();}

}
//----------------------------------------------------------------------------------------
function OnKeyDown(event)
{
	if(event.keyCode==27) {clickedX="";clickedY="";draw();}
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
		clickedX=reversecalculateX(CX*density);
		clickedY=reversecalculateY(CY*density);
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
		if(clickedX!="" && clickedX>X && clickedX<X2 && clickedY>Z && clickedY<Z2)
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
//cleat canvas
ctx.clearRect(0, 0, C_WIDTH, C_HEIGHT);

if(drawoverlay==undefined) drawoverlay=true; //optional parameter (if false, the overlay is never drawn) enhance perfs on mobile while panning

//background image
if(document.getElementById("overlay").checked && (drawoverlay==true || !isMobile()))
{
    try {
        ctx.drawImage(image, calculateX(-3584), calculateY(-3072),calculateX(4608+512)-calculateX(-3584), calculateY(1024+512)-calculateY(-3072));    } // Don't ask me why, but this try-catch block fixes everything on safari. 
    catch (err) {console.error(err)}
}
//axes and grid             
for( var a=Math.round(-1*maxmapsize/1000);a<=Math.round(1*maxmapsize/1000);a++)
{
	if(a==0)
		{ctx.strokeStyle="rgba(80,80,80,1)";}
	else
		{ctx.strokeStyle="rgba(255,255,255,0.3)";}
	ctx.beginPath();
	ctx.moveTo(calculateX(a*1000),calculateY(maxmapsize*-1));
	ctx.lineTo(calculateX(a*1000),calculateY(maxmapsize));
	ctx.stroke();
	
	ctx.beginPath();
	ctx.moveTo(calculateX(maxmapsize*-1),calculateY(a*1000));
	ctx.lineTo(calculateX(maxmapsize),calculateY(a*1000));
	ctx.stroke();
}

//-------------------------------------------- Clicked Coordinates --------------------------------------------
if(clickedX!="")	{	drawtext(calculateX(clickedX),calculateY(clickedY),"X:"+clickedX+" Z:"+clickedY,"CENTER","TOP","rgb(255,255,255)","rgba(112, 158, 40, 1)");}


//-------------------------------------------- CLAIMS --------------------------------------------
SelClaim="";
DrawClaimData();
if(SelClaim!=null) drawClaim(SelClaim[0],SelClaim[1],SelClaim[2],SelClaim[3],SelClaim[4],SelClaim[5]); //calling once again draclaim to draw the selected one if it exists

}
