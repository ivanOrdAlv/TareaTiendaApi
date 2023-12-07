let db;

conectarBBDD();

function conectarBBDD () {
    // Abrir o crear una base de datos
    const request = indexedDB.open('IvanDataBase', 1);

    request.onupgradeneeded = (e) => {
        console.info('Database created');
        db = request.result;
        const objectStoreProducto = db.createObjectStore('producto', { keyPath: 'productId', autoIncrement: true });
        // Definir los campos en la tabla productos
        objectStoreProducto.createIndex("title", "title", { unique: false });
        objectStoreProducto.createIndex("category", "category", { unique: false });
        objectStoreProducto.createIndex("price", "price", { unique: false });
        objectStoreProducto.createIndex("description", "description", { unique: false });
        
        const objectStoreCarrito = db.createObjectStore('carrito', { keyPath: 'id', autoIncrement: true });
         // Definir los campos en la tabla carrito
        objectStoreCarrito.createIndex("id", "id", { unique: true });
        objectStoreCarrito.createIndex("cantidad", "cantidad", { unique: false });
        objectStoreCarrito.createIndex("title", "title", { unique: false });
        objectStoreCarrito.createIndex("price", "price", { unique: false });
    };

    request.onsuccess = event => {
        db = event.target.result;
        // mostrarDatos();
        // mostrarCarrito();
    };
    
    request.onerror = event => {
        console.error('Error al abrir la base de datos:', event.target.errorCode);
    };
}

/*Conexión API*/
window.addEventListener("load",function(event) {
    const actualizarBtn = document.getElementById('getApiData');
    if (actualizarBtn) {
        actualizarBtn.addEventListener('click', () => {
            fetch('https://fakestoreapi.com/products')
                .then(response => response.json())
                .then(data => {
                    // Llamamos a la función para guardar los datos en IndexedDB
                    guardarEnIndexedDB(data);
                })
                .catch(error => console.error('Error al cargar los datos de la API:', error));
        });
    }
},false);


/*Guardar en Base de datos*/
function guardarEnIndexedDB(data) {

    const transaction = db.transaction(['producto'], 'readwrite');
    const objectStore = transaction.objectStore('producto');

    // Almacenar los datos en la base de datos
    data.forEach(user => {
        objectStore.add(user);
    });

    transaction.oncomplete = () => {
        console.log('Datos almacenados en IndexedDB');
        mostrarDatos();
    };
}


/* Mostrar Datos Home*/

function mostrarDatos() {
    try {
        const userDataContainer = document.getElementById('userData');
        userDataContainer.innerHTML = ''; // Limpiar el contenedor antes de mostrar nuevos datos

        const request = db.transaction('producto')
            .objectStore('producto')
            .getAll();

        request.onsuccess = event => {
            const productos = request.result;
            productos.forEach((data, index) => {
                const card = document.createElement('div');
                card.classList.add('col-md-4', 'd-flex', 'justify-content-center', 'mb-4');
                card.innerHTML = `
                    <div class="card" style="width: 18rem;">
                        <img src="${data.image}" class="card-img-top" alt="...">
                        <div class="card-body">
                            <h5>${data.title}</h5>
                            <p class="card-text">${data.category}</p>
                            <p class="card-text">${data.description}</p>
                            <p class="card-text">${data.price}</p>
                            <a href="javascript:addProductCart(${data.productId})" class="btn btn-dark" id="liveToastBtn_${index}">Añadir al carrito</a>
                            <div class="toast-container position-fixed bottom-0 end-0 p-3">
                                <div id="liveToast_${index}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                                    <div class="toast-header">
                                        <small>11 mins ago</small>
                                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                                    </div>
                                    <div class="toast-body">
                                        Su producto ha sido agregado correctamente al carrito
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                userDataContainer.appendChild(card);

                const toastTrigger = document.getElementById(`liveToastBtn_${index}`);
                const toastLiveExample = document.getElementById(`liveToast_${index}`);

                if (toastTrigger) {
                    const toastBootstrap = new bootstrap.Toast(toastLiveExample);
                    toastTrigger.addEventListener('click', () => {
                        toastBootstrap.show();
                    });
                }
            });
        };

    } catch (err) {
        console.error('Aún no se han incorporado datos en la BBDD');
    }
}
/*Agregar productos al carrito*/

function addProductCart(productId) {
    console.log('ID del producto:', productId);
    console.info(db);

    const request = db.transaction('producto')
    .objectStore('producto')
    .get(productId);
    
    request.onsuccess = event => {
        const producto = request.result;
        console.log(producto);

        const transaction = db.transaction(['carrito'], 'readwrite');
        const objectStore = transaction.objectStore('carrito');

        objectStore.getAll().onsuccess = function (event) {
            const allCarrito = event.target.result;

            console.info(allCarrito);
            const exists = allCarrito.find(e => e.id === productId)
            if (exists) {
                exists.cantidad++;
                const updateRequest = objectStore.put(exists);
                updateRequest.onsuccess = function () {
                    console.log('Cantidad actualizada');
                    console.log(exists.cantidad);
                    console.log(exists.price);
                };
                updateRequest.onerror = function (error) {
                    console.error('Error al actualizar la cantidad:', error);
                };
            } else {
                objectStore.add({id: productId, cantidad: 1, title: producto.title, price: producto.price});
            }
        }
    };
}

/*Eliminar productos del carrito*/
function removeProductCart(productId) {
    const request = db.transaction(['carrito'], 'readwrite');
    const objectStore = request.objectStore('carrito');
          objectStore.delete(productId);
             
                            request.onsuccess=()=>{
                                console.log(`Eliminado:${productId}`);
                               
                            }
                            request.onerror=(err)=>{
                                console.log(`Error al eliminar:${err}`);
                            }

                            mostrarCarrito();
}

/* Modificar las cantidades del carrito */

function modificarCantidad(productId, operacion) {
    const transaction = db.transaction(['carrito'], 'readwrite');
    const objectStore = transaction.objectStore('carrito');

    objectStore.getAll().onsuccess = function (event) {
        const allCarrito = event.target.result;

        console.info(allCarrito);
        const producto = allCarrito.find(e => e.id === productId)
        
        if(operacion == "+"){
            producto.cantidad++;
        } else if(operacion == "-") {
            producto.cantidad--;
        }
        
        const updateRequest = objectStore.put(producto);
        updateRequest.onsuccess = function () {
            mostrarCarrito();
            console.log('Cantidad actualizada');
            console.log(producto.cantidad);
            console.log(producto.price);
        };
        updateRequest.onerror = function (error) {
            console.error('Error al actualizar la cantidad:', error);
        };
    }

}

/*Mostrar elementos en el carrito*/

function mostrarCarrito() {
    try {
        const userDataContainer = document.getElementById('carritoContainer');
        userDataContainer.innerHTML = ''; // Limpiar el contenedor antes de mostrar nuevos datos

        const request = db.transaction('carrito')
            .objectStore('carrito')
            .getAll();
        request.onsuccess = event => {
            const productos = request.result;
            const table = document.createElement('table');
            table.classList.add('table', 'table-striped', 'table-bordered');
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th scope="col"></th>
                    <th scope="col">Title</th>
                    <th scope="col">Cantidad</th>
                    <th scope="col">Price</th>
                </tr>
            `;

            const tbody = document.createElement('tbody');
            let totalCarrito = 0; // Inicializar el total del carrito

            productos.forEach((data, index) => {
                const row = document.createElement('tr');
               const subtotal = data.price * data.cantidad;
            totalCarrito += subtotal; // Sumar al total del carrito

                row.innerHTML = `
                    <th scope="row">${index + 1}</th>
                    <td>${data.title}</td>
                    <td>
                        <span class="me-2">${data.cantidad}</span>
                        <div class="text-end">
                            <a href="javascript:modificarCantidad(${data.id}, '-')" class="btn btn-outline-info">-</a>
                            <a href="javascript:modificarCantidad(${data.id}, '+')" class="btn btn-outline-success">+</a>
                            <a href="javascript:removeProductCart(${data.id})" class="btn btn-outline-danger">Eliminar producto</a>
                        </div>
                    </td>
                    <td><span class="text-end">${subtotal}</span></td>                
                `;
                tbody.appendChild(row);
            });

            table.appendChild(thead);
            table.appendChild(tbody);

            userDataContainer.appendChild(table);

            // Mostrar el total del carrito
            const totalElement = document.createElement('div');
            totalElement.innerHTML = `<p class="text-end fw-bold">Total del carrito: ${totalCarrito}</p>`;
            userDataContainer.appendChild(totalElement);
        };
    } catch (err) {
        console.error('Aún no se han incorporado datos en la BBDD');
    }
}

    