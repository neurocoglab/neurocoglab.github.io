
// Utility functions; URLs for code found at various WWW locations are indicated 
// in the comments

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// Create n-dimensional array
function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}


// From: https://stackoverflow.com/questions/64669531/2d-convolution-for-javascript-arrays

function conv_2d(kernel, array){
    var result = uniform_array(array.length, uniform_array(array[0].length, 0));
    var kRows = kernel.length;
    var kCols = kernel[0].length;
    var rows = array.length;
    var cols = array[0].length;
    // find center position of kernel (half of kernel size)
    var kCenterX = Math.floor(kCols/2);
    var kCenterY = Math.floor(kRows/2);
    var i, j, m, n, ii, jj;

    for(i=0; i < rows; ++i){          // for all rows
        for(j=0; j < cols; ++j){          // for all columns
            for(m=0; m < kRows; ++m){         // for all kernel rows
                for(n=0; n < kCols; ++n){        // for all kernel columns
                    // index of input signal, used for checking boundary
                    ii = i + (m - kCenterY);
                    jj = j + (n - kCenterX);
                    // ignore input samples which are out of bound
                    if(ii >= 0 && ii < rows && jj >= 0 && jj < cols){
                        result[i][j] += array[ii][jj] * kernel[m][n];
                    };
                };
            };
        };
    };
    return result;
};


// From https://www.che.utah.edu/~tony/course/material/Statistics/all_funcs.php#pdf

function getPdfF(x, df1, df2){
	return pdf('F', x, new Array(df1, df2));
}

function getCdfF(x, df1, df2){
	return cdf('F', x, new Array(df1, df2));
}

function getCdfT(x, df){
	return cdf('t', x, new Array(df));
}

function getValues(start, stop, step){

	if (step==null){
		step = 1.0;
		}
		
	A = [];
	for (i = start; i<=stop; i+=step){
		A.push(i);
		}
		
	return A;

}

// Find index of value closest to *value* in sorted array A
function getClosest(A, value){

	D = [];
	idx_min = NaN;
	d_min = Number.MAX_VALUE;
	for (i=0; i<A.length; i++){
	dd = Math.abs(A[i]-value);
		if (dd < d_min) {
			d_min = dd;
			idx_min = i;
			}
		}
	return idx_min;

}

function sortnum(sna,snb){return sna-snb;}  //to sort arrays numerically>> array.sort(sortnum);
function csv2array(thestring){
	var csv_data=thestring.split(','); 
	var arrayed_data=new Array();
	for(icsv=0; icsv<csv_data.length; icsv++){arrayed_data[icsv]=parseFloat(csv_data[icsv]);}
	return arrayed_data;
}
function delim2array(thestr,delim){//changes a string of numbers separated by some delimiter into an array
	var possible_delim=new Array(' ','\n','\r','\t',',',';','~','_');//put in order of least probable to most
	if (delim=='' || typeof delim === 'undefined') {//must suss out what the delimeter is
		for (var k in possible_delim){
			if (thestr.indexOf(possible_delim[k])!=-1) delim=possible_delim[k];
		}
	}
	var array_str=thestr.split(delim);
	var rtn=new Array(array_str.length);
	for (i=0;i<array_str.length;i++){rtn[i]=parseFloat(array_str[i]);}
	return rtn;
}

/////////////////////////////////////Integer Functions///////////////////////////
function factorial(xf){
  if ((xf == 0) || (xf == 1))  return 1;
  else {
     result = (xf * factorial(xf-1) )
     return result
  }
}

////////////////////////////////////Basic Continuous Functions/////////////////////////////////

function maxa(thearray) {
var maxav = 0;
for (var i = 0; i < thearray.length; i++) if (thearray[i] > maxav) maxav = thearray[i];
return maxav;
}
function mina(thearray) {
var minav = 1e99;
for (var i = 0; i < thearray.length; i++) if (thearray[i] < minav) minav = thearray[i];
return minav;
}

function sum(xsum){
	var sumans=0;
	for (isum=0; isum<xsum.length; isum++) {sumans+=xsum[isum]; }
	return sumans;
}

function mean(xm){
	var Nmean=xm.length;
	var suma=0;
	for (im=0;im<Nmean;im++) {suma+=xm[im]; }
	return suma/Nmean;
}

function quantile(xquant,pcnt){
	var xqt = xquant.slice(0);
	xqt.sort(sortnum);
	if (pcnt>1) {pcnt=pcnt/100;}
	var iq=Math.ceil(xqt.length*pcnt);
	return(xqt[iq]);
}

function median(xmedt){
	var xmed = xmedt.slice(0); nmed=xmed.length;
	xmed.sort(sortnum);
	if ((nmed%2)==0) { 
	return ((xmed[nmed/2]+xmed[nmed/2-1])/2);}
	else {return xmed[Math.floor(nmed/2)];}
}

function mode(xmodet){
	var xmode = xmodet.slice(0);
	xmode.sort(sortnum);
	var val_array=new Array();
	var num_array=new Array();
	var mode_array=new Array();
	var max_mode_n=1;
	var jmode=0;
	var xi_mode=xmode[0];
	val_array[0]=xi_mode; num_array[0]=0;
	mode_array[0]=xi_mode;
	
	for (imode=0; imode<xmode.length; imode++) {
		if (xi_mode==xmode[imode]){		num_array[jmode]++;		}
		else{
			if (max_mode_n==num_array[jmode]) {
				mode_array.push(val_array[jmode]);
			}
			if (num_array[jmode] > max_mode_n) {
				mode_array.length=0;
				mode_array[0]=val_array[jmode];
				max_mode_n=num_array[jmode];
			}
			xi_mode=xmode[imode];
			jmode++;
			val_array[jmode]=xmode[imode];
			num_array[jmode]=1;
		} 
	}
	if (num_array[(num_array.length-1)]==max_mode_n) {mode_array.push(val_array[(val_array.length-1)]);}
	if (num_array[(num_array.length-1)]>max_mode_n) {mode_array=val_array[(val_array.length-1)];}
	return mode_array;
}

function stdev(xs,corr){//corr should typically be 1 to give the sample standard deviation, for the standard deviation of the sample it should be 0
	var Nstdev=xs.length;
	var sums=0;
	if (corr==null) {var corr=1;}
	xm=mean(xs);
	for (is=0;is<Nstdev;is++) {sums+=(xs[is]-xm)*(xs[is]-xm);}
	return Math.sqrt(sums/(Nstdev-corr));
}

function skewness(xs){
	var sum1=0;
	var sum2=0;
	var xm=mean(xs);
	var n=xs.length;
	for (is=0;is<n;is++){
		sum1+=Math.pow(xs[is]-xm,3);
		sum2+=Math.pow(xs[is]-xm,2);
	}
	skew=sum1/n/Math.pow(sum2/n,3/2);
	return skew;
}

function kurtosis(xs){
	var sum1=0;
	var sum2=0;
	var xm=mean(xs);
	var n=xs.length;
	for (is=0;is<n;is++){
		sum1+=Math.pow(xs[is]-xm,4);
		sum2+=Math.pow(xs[is]-xm,2);
	}
	kurt=sum1/n/Math.pow(sum2/n,2);
	return kurt;
}

function erf(xe){  //erf approximation
  var eres=new Array();
  var xet=new Array();
  var sume=0;
  var c=new Array();//0,-2/Math.sqrt(Math.PI),-6.366197121956e-1;);
  c[0]=0; c[1]=-2/Math.sqrt(Math.PI); c[2]=-6.366197121956e-1; c[3]=-1.027728162129e-1; c[4]=1.912427299414e-2; c[5]=2.401479235527e-4;
  c[6]=-1.786242904258e-3;c[7]=7.336113173091e-4;c[8]=-1.655799102866e-4;c[9]=2.116490536557e-5;c[10]=-1.96623630319e-6;
  var xsqr;
  if (xe.constructor != Array) {xet=new Array(1); xet[0]=xe; eres[0]=0;}
  else {for (ie=0;ie<xe.length;ie++) { eres[ie]=0; xet[ie]=parseFloat(xe[ie]);}}
  for (ie=0;ie<xet.length;ie++) {
 	sgn=1;
	if (xet[ie]<0) sgn=-1;
 	sume=0
 	for (je=1;je<c.length;je++){
		sume=sume+c[je]*Math.pow(Math.abs(xet[ie]),je);
	}
	eres[ie]=sgn*(1-Math.exp(sume))*1;
  }
  return eres;
}

function erfc(xec){  //erf approximation
	return (1-erf(xec));
}

function inverf(f_inverft){
	var ieslope=0;
	var x_inverf=new Array(f_inverft.length);
	if (f_inverft.constructor != Array) {f_inverf=new Array(1); f_inverf[0]=f_inverft;}
	for (ierf=0;ierf<f_inverf.length;ierf++) {
		x_inverf[ierf]=0.5; xold=x_inverf[ierf]/2;
		var ncount=1;
		var err=1e10;
		while (err>(1e-10) && ncount<1000){
			ncount++;
			ieslope=(x_inverf[ierf]-xold)/(erf(x_inverf[ierf])-erf(xold));
			xold=x_inverf[ierf];
			x_inverf[ierf]=x_inverf[ierf]-ieslope*(erf(x_inverf[ierf])-f_inverf[ierf]);
			err=Math.abs(erf(x_inverf[ierf])-f_inverf[ierf]);
		}
	}
	return x_inverf;
}

function gamma(xg){
	var gam=new Array();
	if (xg.constructor != Array) {xgt=new Array(1); xgt[0]=xg;}
	else {xgt=xg;}
	var qc = [75122.6331530,80916.6278952,36308.2951477,8687.24529705,1168.92649479,83.8676043424,2.50662827511];
	for (i=0;i<xgt.length;i++){
		var sum1=0;
		var prod1=1;
		if (xgt[i]==0){gam[i]=1e99;}
		else{
			if ((xgt[i]%1)==0){//if integer
				gam[i]=factorial(xgt[i]-1);
			}
			else{//not integer
				for (j=0;j<qc.length;j++){
					sum1=sum1+qc[j]*Math.pow(xgt[i],j);
  			  		prod1=prod1*(xgt[i]+j);
				}
				gam[i]=(sum1*Math.pow((xgt[i]+5.5),(xgt[i]+0.5))) * Math.exp(-(xgt[i]+5.5))/prod1;
			}
		}
	}
	return gam;
}

function gammainc(xgt,agt){
	var gam=new Array();
	if (xgt.constructor != Array) {xg=new Array(1); xg[0]=xgt;}
	else { xg=xgt;}
	if (agt.constructor != Array) {ag=new Array(1); ag[0]=agt;}
	else {ag=agt;}
	for (ig=0;ig<xg.length;ig++){
		if ((ag[0]%1)==0){//if integer
			gam[ig]=1-Math.exp(-xg[ig]);
			for (jg=1;jg<ag[0];jg++){
				gam[ig]=gam[ig]*jg-Math.pow(xg[ig],jg)*Math.exp(-xg[ig]);
			}
		}
		else{
			maxi=100;
			sum1=0; prod1=1;
			gam[ig]=Math.exp(-xg[ig])*Math.pow(xg[ig],ag[0]);
			for (ig2=0;ig2<maxi;ig2++){
				prod1=prod1*(ag[0]+ig2);
				sum1+=Math.pow(xg[ig],ig2)/prod1;
			}
			gam[ig]=gam[ig]*sum1;
		}
	}
	return gam;
}

function beta(xbt,ybt){
	var bet=new Array();
	if (xbt.constructor != Array) {xb=new Array(1); xb[0]=xbt;}
	else {xb=xbt;}
	if (ybt.constructor != Array) {yb=new Array(1); yb[0]=ybt;}
	else {yb=ybt;}
	for (ib=0;ib<xb.length;ib++){	
		bet[ib]=gamma(xb[ib])*gamma(yb[0])/gamma(yb[0]+xb[ib]);
	}
	return bet;
}
function betainc(xbit,bparamt){
	var beti=new Array();
	var sumc, sumd, a, b, kb, jb;
	var amax=100;
	if (xbit.constructor != Array) {xbi=new Array(1); xbi[0]=xbit;}
	else {xbi=xbit;}
	if (bparamt.constructor != Array) {bparam=new Array(1); bparam[0]=bparamt;}
	else {bparam=bparamt;}
	a=bparam[0]; b=bparam[1];
	for (ib=0;ib<xbi.length;ib++){	
		if ((b%1==0 && a%1!=0) || (a%1==0 && a<amax && b%1==0 && b<=a )){
			jb=b; kb=a;
			suma=0;
			for (ibi=1;ibi<=(jb);ibi++){
				suma+=gamma(a+ibi-1)/gamma(ibi)*Math.pow(xbi[ib],a)*Math.pow(1-xbi[ib],ibi-1);
			}
			beti[ib]=suma/gamma(a);
		}
		else if ((b%1!=0 && a<amax && a%1==0) || (a%1==0 && a<amax && b%1==0 && a<b)){
			jb=b; kb=a;
			sumb=0;
			for (ibi=1;ibi<=(kb);ibi++){
				sumb+=gamma(b+ibi-1)/gamma(ibi)*Math.pow(xbi[ib],ibi-1)*Math.pow(1-xbi[ib],b);
			}
			beti[ib]=1-sumb/gamma(b);
		}		
		else if (a%1==0.5 && b%1==0.5 && a<amax){ //both params are integers+1/2
			kb=a+0.5; jb=b+0.5;
			gamh=Math.sqrt(Math.PI);//  gamma(1/2)
			Ihh=(2/Math.PI)*Math.atan(Math.sqrt(xbi[ib]/(1-xbi[ib])));
			sumc=0;
			for (ibi=1;ibi<=(jb-1);ibi++){
				sumc+=(gamma(a+ibi-0.5)/(gamma(a)*gamma(ibi+0.5)))*Math.pow(xbi[ib],a)*Math.pow(1-xbi[ib],ibi-0.5);
			}
			sumd=0;
			for (ibi=1;ibi<=(kb-1);ibi++){
				sumd+=(gamma(ibi)/(gamma(ibi+0.5)*gamh))*Math.pow(xbi[ib],ibi-1);
			}
			beti[ib]=Ihh-Math.sqrt(xbi[ib]*(1-xbi[ib]))*sumd+sumc;
		}
		else{
			w1=Math.pow(bparam[1]*xbi[ib],1/3);
			if (xbi[ib]<1) w2=Math.pow(bparam[0]*(1-xbi[ib]),1/3);
			else w2=-Math.pow(bparam[0]*(xbi[ib]-1),1/3);
			beti[ib]=0.5*erfc(-3/Math.sqrt(2)*((1-1/(9*bparam[1]))*w1-(1-1/(9*bparam[0]))*w2)/Math.sqrt(w1*w1/bparam[1]+w2*w2/bparam[0]));
		}
	}
	return beti;
}


/////////////////////////////////////////////  PDF  /////////////////////////////////////////////////////////
function pdf(type,xpdft,paramt){
//if type=norm pdf=normal distribution
 ypdf=new Array;
 if (xpdft.constructor != Array) { xpdf=new Array; xpdf[0]=xpdft; }
 else {xpdf=xpdft}
 if (paramt.constructor != Array) { param=new Array; param[0]=paramt; }
 else {param=paramt}
 if (type==null) {type='norm';}
 if (type=='uni'){//uniform distribution
 	if (param==null) param=new Array(0,1);
	uni_height=1/param[1];
	for ( ip=0; ip<xpdf.length; ip++ ){
		if (xpdf[ip]>=(param[0]-param[1]/2) && xpdf[ip]<=(param[0]+param[1]/2)) {ypdf[ip]=uni_height;}
		else {ypdf[ip]=0;}
	}
 }
 if (type=='norm'){//normal, gaussian distribution
 	if (param==null) param=new Array(0,1);
	c1=Math.sqrt(1/(2*Math.PI))/param[1];
	c2=1/(2*param[1]*param[1]);
 	for ( ip=0; ip<xpdf.length; ip++ ){
		ypdf[ip]=c1 * Math.exp(-(xpdf[ip]-param[0])*(xpdf[ip]-param[0])*c2);
	}
 }
 if (type=='exp'){//exponential
 	if (param==null) {param=new Array(1);}
	for ( ip=0; ip<xpdf.length; ip++ ){
		ypdf[ip]=param[0]*Math.exp(-param[0]*xpdf[ip]);
	}
 }
 if (type=='t'){
 	if (param==null) {param=new Array(1);}
	if (param[0]<271){
		c1=gamma((param[0]+1)/2)/(Math.sqrt(param[0]*Math.PI)*gamma(param[0]/2));
 		for ( ip=0; ip<xpdf.length; ip++ ){
			ypdf[ip]=c1 * Math.pow((1+xpdf[ip]*xpdf[ip]/param[0]),(-param[0]-1)/2);
		}
	}
	else {
		paramn=new Array;
		paramn[0]=0;paramn[1]=1;
	 	ypdf[ip]=pdf('norm',xpdf,paramn);
		
	}
 }
 if (type=='chi'){//chi squared
 	if (param==null) {param=new Array(1);}
	c1=1/(Math.pow(2,param[0]/2)*gamma(param[0]/2));
	for ( ip=0; ip<xpdf.length; ip++ ){
		ypdf[ip]=c1 * Math.pow(xpdf[ip],param[0]/2-1)*Math.exp(-xpdf[ip]/2);
	}
 }
 if (type=='ln'){//log normal
 	if (param==null) param=new Array(0,1);
	c1=1/Math.sqrt(2*Math.PI*param[1]*param[1]);
	c2=2*param[1]*param[1];
	for ( ip=0; ip<xpdf.length; ip++ ){
		ypdf[ip]=(c1/xpdf[ip])*Math.exp(-Math.pow(Math.log(xpdf[ip])-param[0],2)/c2) ;
		if (xpdf[ip]==0) ypdf[ip]=0;
	}
 }
 if (type=='f' || type=='F'){//F distribution
 	if (param==null) param=new Array(1,1);
	d1=param[0]; d2=param[1];
	c1=Math.pow(d1,d1)*Math.pow(d2,d2);
	for ( ip=0; ip<xpdf.length; ip++ ){
		ypdf[ip]=Math.sqrt( Math.pow(xpdf[ip],d1)*c1/Math.pow(d1*xpdf[ip]+d2,d1+d2) )/(xpdf[ip]*beta(d1/2,d2/2)) ;
	}
 }
  if (type=='max'){//normal, gaussian distribution
 	if (param==null) param[0]=1;
	c1=Math.sqrt(2/(Math.PI))/Math.pow(param[0],3);
	c2=-1/(2*param[0]*param[0]);
 	for ( ip=0; ip<xpdf.length; ip++ ){
		ypdf[ip]=c1 * xpdf[ip]*xpdf[ip]*Math.exp(xpdf[ip]*xpdf[ip]*c2);
	} 
 }
 ////////////discrete pdfs//////////////
 if (type=='d_uni' ){//Discreete uniform
 	if (param==null) param[0]=6;
	for ( ip=0; ip<xpdf.length; ip++ ){
		if (xpdf[ip]>0 && xpdf[ip]<=param[0] && (xpdf[ip]%1)==0) {ypdf[ip]=1/param[0];}
		else {ypdf[ip]=0;}
	}
 } 
  if (type=='d_binom' ){//Discreete uniform
 	if (param==null) param=new Array(10,0.5);
	var nfact=factorial(param[0]);

	for ( ip=0; ip<xpdf.length; ip++ ){
		if (xpdf[ip]>=0 && xpdf[ip]<=param[0] && (xpdf[ip]%1)==0) {
			ypdf[ip]=nfact/factorial(xpdf[ip])/factorial(param[0]-xpdf[ip])*Math.pow(param[1],xpdf[ip])*Math.pow(1-param[1],param[0]-xpdf[ip]);
		}
		else {ypdf[ip]=0;}
	}
 } 
 return ypdf;
}
///////////////////////////////////////////////////////  C D F  /////////////////////////////////
function cdf(type,xcdft,paramt){
  var ycdf=new Array;
  var xcdf=new Array;
  var param=new Array;
  var ic;
 
  if (xcdft.constructor != Array) { xcdf=new Array; xcdf[0]=xcdft; }
  else {xcdf=xcdft}
  if (paramt!=null) {
  	if (paramt.constructor != Array) { param=new Array; param[0]=paramt; }
 	 else {param=paramt}
  }
//if type=norm pdf=normal distribution
  if (type==null) {type='norm';}
  if (type=='uni'){//uniform distribution
 	if (param==null) param=new Array(0,1);
	for ( ip=0; ip<xpdf.length; ip++ ){
		if (xcdf[ip]>=(param[0]-param[1]/2) && xcdf[ip]<=(param[0]+param[1]/2)) {ycdf[ip]=(xcdf[ip]-param[0]+param[1]/2)/param[1]}
		if (xcdf[ip]<(param[0]-param[1]/2)) {ycdf[ip]=0;}
		if (xcdf[ip]>(param[0]+param[1]/2)) {ycdf[ip]=1;}
	}
  }
  if (type=='norm'){
 	if (param==null) {param=new Array; param[0]=0; param[1]=1;}
	c1=Math.sqrt(2)*param[1];
 	for ( ic=0; ic<xcdf.length; ic++ ){
		ckj=(xcdf[ic]-param[0]) / c1;
		erfx=erf(ckj);
		ycdf[ic]=0.5 + erfx/2;
	}
 }
 if (type=='ln'){//log normal
 	if (param==null) {param=new Array(1,1);}
	c1=Math.sqrt(2*param[1]*param[1]);
	for ( ic=0; ic<xcdf.length; ic++ ){
		ycdf[ic]=0;
		if (xcdf[ic]>0) ycdf[ic]=0.5+0.5*erf((Math.log(xcdf[ic])-param[0])/c1);
	}
 }
 if (type=='exp'){//log normal
 	if (param==null) {param=new Array(1);}
	for ( ic=0; ic<xcdf.length; ic++ ){
		ycdf[ic]=0;
		if (xcdf[ic]>0) ycdf[ic]=1-Math.exp(-param[0]*xcdf[ic]);
	}
 }
 if (type=='chi'){//chi squared
 	if (param==null) {param=new Array(1);}
	c1=1/gamma(param[0]/2);
	for ( ic=0; ic<xcdf.length; ic++ ){
		ycdf[ic]=0;
		if (xcdf[ic]>0) ycdf[ic]=c1 * gammainc(xcdf[ic]/2,param[0]/2);
	}
 }
 if (type=='t'){//student t
 	var tg;
	var v=param[0];
	bparam=new Array;
 	if (v==null) {v=1;}
 	for ( ic=0; ic<xcdf.length; ic++ ){
		if (v==1) { ycdf[ic]=Math.atan(xcdf[ic])/Math.PI+.5;}
		if (v>=200) {
			paramn=new Array;
			paramn[0]=0; paramn[1]=1;
	 		ycdf[ic]=cdf('norm',xcdf[ic],paramn);
		}
		if ((v<200) && (v>1)) {
			if (xcdf[ic]==0) {ycdf[ic]=0.5;}
			else if (v<(xcdf[ic]*xcdf[ic])){
			//	bparam[0]=v/2; bparam[1]=0.5;
				ycdf[ic]=betainc(v/(v+xcdf[ic]*xcdf[ic]),[v/2,1/2])/2;
				if (xcdf[ic]>0) ycdf[ic]=1-ycdf[ic];
			}
			else{
				bparam[1]=v/2; bparam[0]=0.5;
				var sgn=1;
				if (xcdf[ic]<0) sgn=-1;
				ycdf[ic]=0.5+sgn*betainc(xcdf[ic]*xcdf[ic]/(v+xcdf[ic]*xcdf[ic]),bparam)/2;		
			}
		}
	}
 }
 if (type=='f' || type=='F'){//F distribution
 	if (param==null) param=new Array(1,1);
	//var nrmc=new Array(1);var nrmp=new Array(0,1);
	var paramnew=new Array;
	paramnew[0]=param[0]/2;  paramnew[1]=param[1]/2;
	for ( ic=0; ic<xcdf.length; ic++ ){
		xnew=xcdf[ic]*param[0]/(xcdf[ic]*param[0]+param[1]);
		ycdf[ic]=0;
		if (xcdf[ic]>0) ycdf[ic]=betainc(xnew,paramnew);
	}
 }
 if (type=='max'){
 	if (param==null) {param[0]=0;}
	c1=1/Math.sqrt(2)/param[0];
	c2=Math.sqrt(2/Math.PI)/param[0];
	c3=-1/2/param[0]/param[0];
 	for ( ic=0; ic<xcdf.length; ic++ ){
		ycdf[ic]=erf(xcdf[ic]*c1)-c2*xcdf[ic]*Math.exp(c3*xcdf[ic]*xcdf[ic]);
	}
 }
 if (type=='ad' || type=='AD'){//Anderson-Darling CDF for test of normalicy 
 //FROM: Trujillo-Ortiz, A., R. Hernandez-Walls, K. Barba-Rojo and A. Castro-Perez. (2007). AnDartest:Anderson-Darling test for assessing normality of a sample data. A MATLAB file. [WWW document]. URL http://www.mathworks.com/matlabcentral/ fileexchange/loadFile.do?objectId=14807
	if (param==null) param=new Array(1);
	for ( ic=0; ic<xcdf.length; ic++ ){
		if (xcdf[ic] == 0) {ycdf[ic] = 0;}
	    if (xcdf[ic] > 0 && xcdf[ic] < 0.2){
        	ycdf[ic] = Math.exp(-13.436 + 101.14*xcdf[ic] - 223.73*xcdf[ic]*xcdf[ic]);}
    	if (xcdf[ic] >= 0.200 && xcdf[ic] < 0.34){
        	ycdf[ic] = Math.exp(-8.318 + 42.796*xcdf[ic] - 59.938*xcdf[ic]*xcdf[ic]);}
    	if (xcdf[ic] >= 0.34 && xcdf[ic] < 0.6){
        	ycdf[ic] = 1-Math.exp(0.9177 - 4.279*xcdf[ic] - 1.38*xcdf[ic]*xcdf[ic]);}
    	if ((xcdf[ic] >= 0.6) && (xcdf[ic] < 13)){
       		ycdf[ic] = 1-Math.exp(1.2937 - 5.709*xcdf[ic] + 0.0186*xcdf[ic]*xcdf[ic]);}
		if (xcdf[ic] >= 13)  {ycdf[ic] = 1;}
	}
 }
  ////////////discrete cdfs//////////////
 if (type=='d_uni' ){//Discreete uniform
 	if (param==null) param[0]=6;
	for ( ic=0; ic<xcdf.length; ic++ ){
		if (xcdf[ic]>0 && xcdf[ic]<=param[0]) {ycdf[ic]=Math.floor(xcdf[ic])/param[0];}
		if (xcdf[ic]<1) {ycdf[ic]=0;}
		if (xcdf[ic]>param[0]) {ycdf[ic]=1;}
	}
 } 
  if (type=='d_binom' ){//Discreete uniform
 	if (param==null) param=new Array(10,0.5);
	var nfact=factorial(param[0]);
	for ( ic=0; ic<xcdf.length; ic++ ){
		if (xcdf[ic]>=0 && xcdf[ic]<=param[0]) {
			ycdf[ic]=0;
			for (jc=0;jc<=Math.floor(xcdf[ic]);jc++){
				ycdf[ic]+=nfact/factorial(jc)/factorial(param[0]-jc)*Math.pow(param[1],jc)*Math.pow(1-param[1],param[0]-jc);
			}
		}
		if (xcdf[ic]<0) {ycdf[ic]=0;}
		if (xcdf[ic]>param[0]) {ycdf[ic]=1;}
	}
 } 
 
 return ycdf;
}

function invcdf(type,fcdft,paramt){
  var ycdf=new Array;
  var fcdf=new Array;
  var xcdf=new Array;
  var param=new Array;
  var xold=new Array;
  var ic, slope,err;
  if (fcdft.constructor != Array) { fcdf=new Array; fcdf[0]=fcdft; }
  else {fcdf=fcdft}
  if (paramt.constructor != Array) { param=new Array; param[0]=paramt; }
  else {param=paramt}
  for ( ic=0; ic<fcdf.length; ic++ ){
  	xcdf[ic]=0.99; xold=0.01;
  	if (type=='norm') {xcdf[ic]=param[0]-param[1]; xold=param[0]+param[1];}
	if (type=='max') {xcdf[ic]=param[0]/2; xold=param[0]*2;}
  	if (type=='chi') {xcdf[ic]=param[0]/2; xold=param[0]*2;}
	if (type=='uni') {xcdf[ic]=param[0]; xold=param[0]-param[1]/4;}
	err=1;
	var ncount=0;
	var flipnorm=false;
	if (type=='norm' && fcdf[ic]>0.5) {fcdf[ic]=1-fcdf[ic];  flipnorm=true;} 
	if (type=='exp') {xcdf[ic]=-Math.log(1-fcdf[ic])/param[0];}
	if (type=='uni') {xcdf[ic]=param[0]-param[1]/2; if (fcdf[ic]>=0 && fcdf[ic]<=1) {xcdf[ic]=param[0]-param[1]/2+fcdf[ic]*param[1];} }
	if (type!='exp' && type!='uni'){
		while (err>(1e-10) && ncount<1000){
			ncount++;
			slope=(xcdf[ic]-xold)/(cdf(type,xcdf[ic],param)-cdf(type,xold,param));
			xold=xcdf[ic];
			xcdf[ic]=xcdf[ic]-slope*(cdf(type,xcdf[ic],param)-fcdf[ic]);
			if (type=='ln' || type=='chi' || type=='f' || type=='F' || type=='max'){
				if (xcdf[ic]<0) xcdf[ic]=0;
				if (xcdf[ic]>1e6) xcdf[ic]=1e6;
			}
			err=Math.abs(cdf(type,xcdf[ic],param)-fcdf[ic]);
		}
		if (type=='norm' && flipnorm) {xold=2*param[0]-xold; xcdf[ic]=2*param[0]-xcdf[ic];  }
	}
  }
  xold=xcdf[0];
  
  if (fcdf.length==1) {return xold;}
  else {return xcdf;}
}
/////////////////////////////////////////STATISTICS, CL, and CI FUNCTIONS//////////////////////
function normality(xn){
	xn.sort(sortnum);
	var xm=mean(xn);
	var sd=stdev(xn);
	var sum1=0;
	var ynt;
	var n=xn.length;
	var ynorm;
	var param=new Array(); param[0]=xm; param[1]=sd;
	ynorm=cdf('norm',xn,param);
	for ( ic=1; ic<=n; ic++ ){
		sum1+=((2*ic-1)/n)*( Math.log(ynorm[ic-1])+Math.log(1-ynorm[n-ic]) );
	}
	var A2=-n-sum1;
	Aa2=A2*(1+0.75/n+2.25/n/n);
	
	var rtn=new Array();
	rtn[0]=1-cdf('ad',Aa2);
	rtn[1]=Aa2;
	return rtn;
}

function ttest_ci(cl,stdv,n,ntail){//find the confidence interval for one sent of data, given the confidence level
 	if (cl>1) {cl=cl/100;}//take fraction or percent
	if (cl<0 || cl>1) {alert('Error in ttest_ci: confidence level must be a percent between 0 and 100, or a fraction between 0 and 1.');}
	if (cl==1) {
		var ci=1.7976931348623157E+10308;//infinity
		var tstat=ci;
	}
	else{
		if (ntail==null) {ntail=2;}  //if not specified do a two tail test
		if (ntail!=1 && ntail!=2) {alert('Error in ttest_ci: ttest must either a 1 or 2 tail test.');}
		var pc=(1-cl)/ntail; 
		var para=new Array();
		var rtn=new Array();
		para[0]=n-1;
		var tstat=Math.abs(invcdf('t',pc,para));
		var ci=tstat/Math.sqrt(n)*stdv;
	}
	return [ci,tstat];
}
function ttest_cl(ci,stdv,n,ntail){//find the confidence level for one sent of data, given the confidence interval
	if (ntail==null) {ntail=2;}  //if not specified do a two tail test
	if (ntail!=1 && ntail!=2) {alert('Error in ttest_ci: ttest must either a 1 or 2 tail test.');}
	tstat=Math.sqrt(n)*ci/stdv;
	var pc=cdf('t',-tstat,[n-1]);
	cl=(1-pc*ntail)*100;
	return [cl,tstat];
}

///////////////////////////////  fitting   ////////////////////////////////////////////////////
function linfit(xf,yf,finderr,fCL){
	if (finderr=='') finderr=false;
	if (fCL=='') fCL=0.95;//confidence level
	var Sx=0; var Sy=0; var Sxx=0; var Sxy=0;
	var n=xf.length;
	for (jf=0;jf<n;jf++){
		Sx+=xf[jf];
		Sy+=yf[jf];
		Sxx+=xf[jf]*xf[jf];
		Sxy+=xf[jf]*yf[jf];
	}
	
	var avgx=Sx/n; var avgy=Sy/n;
	var rtn=new Array();
	rtn[0]=(Sxy-n*avgx*avgy)/(Sxx-n*avgx*avgx);//slope 
	rtn[1]=(avgy*Sxx-avgx*Sxy)/(Sxx-n*avgx*avgx);//intercept
	if (finderr){
		var SStotal=0;
		var SSerror=0;
		var SSx=0;
		for (jf=0;jf<n;jf++){
			SStotal+=Math.pow((yf[jf]-avgy),2);
			SSerror+=Math.pow((yf[jf]-rtn[0]*xf[jf]-rtn[1]),2);
			SSx+=Math.pow((xf[jf]-avgx),2);
		}
		var sm=Math.sqrt(SSerror/(n-2)/SSx);
		var sb=Math.sqrt(Sxx*sm*sm/n);
		var tstat=Math.abs(invcdf('t',(1-fCL)/2,n-2));
		
		rtn[2]=1-SSerror/SStotal; //R squared
		rtn[3]=tstat*sm; //CI on slope
		rtn[4]=tstat*sb; //CI on slope
	}
	return rtn;
}