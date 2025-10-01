<?php

/** for display of a triangle 3X4 
**/

function fixedDisplay(){
$row=3;
$col=4;
for($i=1;$i<=$row;$i++){
  for($j=1;$j<=$i && $j<=$col;$j++){
    echo "*";
  }//End of innerloop
   echo "\n";
 }//End of outerloop
}//End of Function

/** For the bonus 
** To accept any M X N,where both parameter are positive.
**/

function dynamicDisplay($m,$n){
if($m<=0||$n<=0){
   echo ("Both $m and $n should be positive number.\n");
   return;
}//End of if
for($i=1;$i<=$m;$i++){
  for($j=1;$j<=$i &&$j<=$n;$j++){
      echo "*";
  }//End of innerloop
  echo "\n";
}//End of outerloop 

}//End of function


//To test the function
echo "Fixed Display for triangle 3X4\n";
fixedDisplay();

echo "Dynamic Display for triangle MXN\n";
dynamicDisplay(7,8);

?>