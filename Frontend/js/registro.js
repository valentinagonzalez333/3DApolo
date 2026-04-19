document.getElementById('registro-forma').addEventListener('submit', (e) => {
   e.preventDefault();
    console.log(e.target.children.user.value);
});     