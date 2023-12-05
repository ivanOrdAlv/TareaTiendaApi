document.addEventListener("DOMContentLoaded", () => {
     fetch('https://fakestoreapi.com/products')
        .then(response => response.json())
        .then(products => displayProducts(products))
        .catch(error => console.error('Error fetching products:', error));


window.openAddProductModal = () => {
    const addProductModal = document.getElementByClassName('addProductModal');
    addProductModal.style.display = 'block';
};

window.closeAddProductModal = () => {
    const addProductModal = document.getElementByClassName('addProductModal');
    addProductModal.style.display = 'none';
};

window.addProductToDB = (productName, price, description, image, category) => {
    const dbPromise = idb.openDB('mi-base-de-datos', 1);

    dbPromise.then(db => {
        const tx = db.transaction('productos', 'readwrite');
        const store = tx.objectStore('productos');

        // Generar un ID único para el producto (puedes usar una biblioteca como uuid)
        const productId = generateUniqueId();

        // Objeto del producto
        const product = {
            id: productId,
            name: productName,
            price: price,
            description: description,
            image: image,
            category: category
        };

        // Agregar el producto a la base de datos
        store.add(product);

        console.log('Producto agregado con éxito:', product);

        // Cerrar el modal después de agregar el producto
        closeAddProductModal();
    });

    
};

// Función para generar un ID único (puedes usar una biblioteca externa si es necesario)
function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}



window.getProductFromDB = (productId) => {
    const dbPromise = idb.openDB('mi-base-de-datos', 1);

    dbPromise.then(db => {
        const tx = db.transaction('productos', 'readonly');
        const store = tx.objectStore('productos');
        return store.get(productId);
    }).then(product => {
        if (product) {
            console.log('Producto encontrado:', product);
            // Aquí puedes hacer algo con el producto, por ejemplo, mostrarlo en un modal
        } else {
            console.log('Producto no encontrado.');
        }
    });
};

function displayProducts(products) {
    const productList = document.getElementById('producto');

    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.classList.add('product');

        // Añadir más contenido según la estructura de tus productos
        productElement.innerHTML = `
        <div class="producto">
        <div class="img">
            <img src="${product.image}" alt="${product.title}">
        </div>
        <div class="titulo">
            <h3>${product.title}</h3>
        </div>
        <div class="precio">
            <p>${product.price}€</p>
        </div>
        <div class="descripcion">
            <p>${product.description}</p>
           </div> 
        </div>
            `;

        productList.appendChild(productElement);
    });
}

window.updateProductInDB = (productId, updatedData) => {
    const dbPromise = idb.openDB('mi-base-de-datos', 1);

    dbPromise.then(db => {
        const tx = db.transaction('productos', 'readwrite');
        const store = tx.objectStore('productos');

        // Obtener el producto actual
        return store.get(productId);
    }).then(product => {
        if (product) {
            // Actualizar los datos del producto
            Object.assign(product, updatedData);

            // Guardar el producto actualizado
            store.put(product);

            console.log('Producto actualizado:', product);
        } else {
            console.log('Producto no encontrado.');
        }
    });
};

window.deleteProductFromDB = (productId) => {
    const dbPromise = idb.openDB('mi-base-de-datos', 1);

    dbPromise.then(db => {
        const tx = db.transaction('productos', 'readwrite');
        const store = tx.objectStore('productos');

        // Eliminar el producto por su ID
        store.delete(productId);

        console.log('Producto eliminado con éxito.');
    });
};



});