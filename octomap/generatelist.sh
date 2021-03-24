#/bin/bash
ls *.png | sed -e 's/map/octolist.push("/g'| sed -e 's/\.png/");/g' > list.js
