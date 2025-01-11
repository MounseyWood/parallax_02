html,
body {
    box-sizing: border-box;
    margin: 0;
    height: 100%;
    background: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: sans-serif;
}
.image-container {
    display: flex;
    height: 100%;
    width: 100%;
    max-width: 100%;
    position: relative;
}
.canvas {
    width: auto;
    max-height: 100%;
    max-width: 100%;
    display: block;
    margin: auto;
}
.loading-screen {
    position:absolute;
    width: 100%;
    height: 100%;
    background: white;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    visibility: visible;
    opacity: 1;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    line-height: 40px;
    transition: 0.25s ease all 0.75s;
    color: #999;
    transform: translateZ(50px);
}
.loading-screen.hidden {
    visibility: hidden;
    opacity: 0;
}
