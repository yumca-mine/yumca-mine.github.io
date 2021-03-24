#/bin/bash
ls map*.png | sed -e 's/map/fulllist.push("/g'| sed -e 's/\.png/");/g' > list.js
