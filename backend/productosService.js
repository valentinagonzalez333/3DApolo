

async function getProductos() {
    const res = await fetch ('http://localhost:4000/productos')
    const data = await res.json()
    return data

}