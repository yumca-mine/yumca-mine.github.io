#/bin/bash
ls *.png | sed -e 's/map/octo18list.push("/g'| sed -e 's/\.png/");/g' > list.js
