/* PLMun Business Center — theme
   Loaded in <head> so the saved theme is applied before the first paint. */

function toggleTheme(){
  var currentTheme=document.documentElement.getAttribute("data-theme");
  var newTheme=currentTheme==="light"?"dark":"light";
  if(!currentTheme){
    var prefersDark=window.matchMedia("(prefers-color-scheme: dark)").matches;
    newTheme=prefersDark?"light":"dark";
  }
  document.documentElement.setAttribute("data-theme",newTheme);
  try{localStorage.setItem("plmun_theme",newTheme);}catch(e){}
  updateThemeButton();
}

function updateThemeButton(){
  var tBtn=document.getElementById("themeToggle");
  if(!tBtn)return;
  var currentTheme=document.documentElement.getAttribute("data-theme");
  if(!currentTheme){
    currentTheme=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
  }
  if(currentTheme==="dark"){
    tBtn.innerHTML="☀️ Light";
  }else{
    tBtn.innerHTML="🌙 Dark";
  }
}

(function(){
  try{
    var saved=localStorage.getItem("plmun_theme");
    if(saved){
      document.documentElement.setAttribute("data-theme",saved);
    }
  }catch(e){}
  /* Fill the theme button as soon as the DOM is ready, so it never starts blank
     (the login screens return from render() before updating it). */
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",updateThemeButton);
  }else{
    updateThemeButton();
  }
})();
