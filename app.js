const express = require("express");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const port = 3000;
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

main().catch(err => console.log(err));
async function main() {
    await mongoose.connect("mongodb+srv://nikhilhpr18:viraT%4018@cluster0.hc3e8es.mongodb.net/todoDB?retryWrites=true&w=majority");

    const todoschema = new mongoose.Schema({
        name: String
    });

    const item = mongoose.model("Item", todoschema);

    const item1 = new item({ name: "Mango" });
    const item2 = new item({ name: "Watermelon" });
    const item3 = new item({ name: "Apple" });
    const item4 = new item({ name: "Grapes" });
    console.log(item1.name);

    const itemArr = [item1, item2, item3, item4];

    const listSchema = {
        name: String,
        items: [todoschema] // using previously created schema.
    };

    const List = mongoose.model("List", listSchema);

    const fruit = ["Litchi"]
    const day = date.getDate();

    app.get("/", async (req, res) => { // Make the callback function async
        const allItems = await item.find({}); // Use await to wait for the operation to complete. it return array.
        if (allItems.length === 0) {
            await item.insertMany(itemArr); // Use await to wait for the operation to complete
            res.redirect("/")
        } else {
            res.render("list", { listTitle: day, itemList: allItems }) // Pass the items to the view
            // console.log(allItems);
        }

    });

    app.get("/:customListName", async (req, res) => {
        const customListName = _.capitalize(req.params.customListName);

        try {
            const foundItem = await List.findOne({
                name: customListName
            });

            if (foundItem) {
                //show existing list 
                res.render("list", { listTitle: foundItem.name, itemList: foundItem.items })
                console.log("exist!");
            } else {
                //cretate new list
                const list = new List({
                    name: customListName,
                    items: itemArr
                });
                await list.save();
                res.redirect("/" + customListName)
                console.log("not exist!");
            }
        } catch (error) {
            console.log(error);
        }

    });

    app.post("/", async (req, res) => {
        const addedItem = req.body.additem;
        const listName = req.body.submit;
        const day = date.getDate();

        const newItem = new item({ name: addedItem });

        if (listName === day) {
            await newItem.save();
            res.redirect("/");
        } else {
            try {
                const listSearch = await List.findOne({ name: listName });

                if (listSearch) {
                    listSearch.items.push(newItem);
                    await listSearch.save();
                    res.redirect("/" + listName);
                } else {
                    console.log("List not found.");
                    // Handle the case where the list with the provided name doesn't exist.
                }
            } catch (error) {
                console.error(error);
            }
        }
    });


    app.post("/delete", async (req, res) => {
        const checkedItemId = req.body.checkbox.trim();
        const listname = req.body.listName;
        console.log(listname);
        console.log(checkedItemId);

        if (listname === day) {
            try {
                await item.findByIdAndDelete(checkedItemId);
                console.log(`Deleted item with ID: ${checkedItemId}`);
            } catch (error) {
                console.error(`Error deleting item: ${error}`);
            }

            res.redirect("/");
        }else{
           await List.findOneAndUpdate({name:listname}, {$pull: {items:{_id: checkedItemId}}} ); // in pull we pass arr name [].
           res.redirect("/" +listname);
        }

    });

    app.listen(port, (req, res) => {
        console.log(`server in running on ${port}`);
    });
}
