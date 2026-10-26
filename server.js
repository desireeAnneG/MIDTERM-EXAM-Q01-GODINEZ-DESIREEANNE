const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


function readProducts() {

    const raw = fs.readFileSync(DATA_FILE, "utf-8");

    return JSON.parse(raw);

}

function writeProducts(products) {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(products, null, 2)
    );

}


function getStockStatus(stock) {

    if (stock === 0) {
        return "OUT OF STOCK";
    }

    if (stock >= 1 && stock <= 5) {
        return "LOW STOCK";
    }

    return "AVAILABLE";

}

function withStatus(product) {

    return {
        ...product,
        stock_status: getStockStatus(product.stock)
    };

}

app.get("/api/products", (req, res) => {

    try {

        const products = readProducts();

        res.status(200).json(
            products.map(withStatus)
        );

    } catch (error) {

        res.status(500).json({
            message: "Failed to read data file."
        });

    }

});

app.get("/api/products/:id", (req, res) => {

    try {

        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {

            return res.status(400).json({
                message: "ID must be a valid integer."
            });

        }

        const products = readProducts();

        const product =
            products.find(p => p.id === id);

        if (!product) {

            return res.status(404).json({
                message: "Product not found."
            });

        }

        res.status(200).json(withStatus(product));

    } catch (error) {

        res.status(500).json({
            message: "Failed to read data file."
        });

    }

});

app.post("/api/products", (req, res) => {

    try {

        const {
            product_name,
            category,
            price,
            stock
        } = req.body;

        if (
            typeof product_name !== "string" ||
            product_name.trim() === "" ||
            typeof category !== "string" ||
            category.trim() === "" ||
            price === undefined ||
            price === null ||
            price === "" ||
            stock === undefined ||
            stock === null ||
            stock === ""
        ) {

            return res.status(400).json({
                message:
                    "Error: Product name, category, price, and stock are required."
            });

        }


        const priceNum = Number(price);
        const stockNum = Number(stock);


        if (Number.isNaN(priceNum) || Number.isNaN(stockNum)) {

            return res.status(400).json({
                message: "price and stock must be numbers."
            });

        }


        if (stockNum < 0) {

            return res.status(400).json({
                message: "Stock cannot be less than 0."
            });

        }


        if (!Number.isInteger(stockNum)) {

            return res.status(400).json({
                message: "Stock must be a whole number."
            });

        }


        if (priceNum < 0) {

            return res.status(400).json({
                message: "Price cannot be negative."
            });

        }


        const products = readProducts();

        // Generate next ID

        const nextId =
            products.length > 0
                ? Math.max(...products.map(p => p.id)) + 1
                : 1;


        const newProduct = {

            id: nextId,

            product_name: product_name.trim(),

            category: category.trim(),

            price: priceNum,

            stock: stockNum

        };


        products.push(newProduct);

        writeProducts(products);


        res.status(201).json({

            message: "Product added successfully.",

            product: withStatus(newProduct)

        });

    } catch (error) {

        res.status(500).json({
            message: "Failed to save product."
        });

    }

});


// ========================================
// DELETE /api/products/:id - Delete
// ========================================

app.delete("/api/products/:id", (req, res) => {

    try {

        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {

            return res.status(400).json({
                message: "ID must be a valid integer."
            });

        }

        const products = readProducts();

        const index =
            products.findIndex(p => p.id === id);

        if (index === -1) {

            return res.status(404).json({
                message: "Product not found."
            });

        }

        const deleted = products.splice(index, 1)[0];

        writeProducts(products);

        res.status(200).json({

            message: "Product deleted successfully.",

            product: withStatus(deleted)

        });

    } catch (error) {

        res.status(500).json({
            message: "Failed to delete product."
        });

    }

});


// ========================================
// Start Server
// ========================================

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});
