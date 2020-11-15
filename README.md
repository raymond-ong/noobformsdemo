# Description
This is a quick POC project for using CSS Grid to implement a React-based Dashboard.

# Features
## Page Designer
Functionalities:
* Add controls from the toolbox via Drag and Drop
* Resize control by dragging the lower right edge of the control
* Configure the controls from the Properties Pane

![Page Designer GIF image](https://github.com/raymond-ong/noobformsdemo/blob/master/public/page%20designer%20-%20short.gif?raw=true)

## Dashboard Hierarchy Designer
![Dashboard Hierarchy Designer GIF image](https://github.com/raymond-ong/noobformsdemo/blob/master/public/hier%20designer%20-%20short.gif?raw=true)

## Dashboard Viewer
![Dashboard Hierarchy Designer GIF image](https://github.com/raymond-ong/noobformsdemo/blob/master/public/dashboard%20-%20short.gif?raw=true)


## Other Features
* Generate PDF Reports
* Sample Report here: (https://github.com/raymond-ong/noobformsdemo/blob/master/public/SampleReport.pdf)

# Demo App
URL: (https://raymond-ong.github.io/noobformsdemo/)
Caveats:
* This demo app was modified to use the browser's local storage to store the configured page layouts, hierarchies and images (for the ImageMap Control).
* In the original project, the controls connect to a REST API Server to get its data
* PDF Generation is not supported in this demo app because PDF Generation is handled in the backend server (using Puppeteer). This demo app is purely front end only.


## How to use
Step 1: Design pages using the Page Designer

Step 2: Design the Dashboard Hierarchy using the Hierarchy Designer

Step 3: View the designed Hierarchy and Pages in the Plant Manager View
Please refresh the page after Step 2 in order to reflect changes made in Step 2.

Optional steps:
* Designate a Map View (first tab) and Analysis View (2nd tab)
Go to the Hierarchy Designer, select any configured page, and tick the "Display as Map View tab" or "Display as Analysis View tab"
