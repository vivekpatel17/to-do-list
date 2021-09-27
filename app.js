const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

app.set('view engine', 'ejs');

const itemsSchema = new mongoose.Schema ({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to ToDo List"
});
const item2 = new Item({
    name: "Hit + to Add Item"
});
const item3 = new Item({
    name: "Hit chechbox to Delete Item"
});
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema ({
    name: String,
    items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

const day = date.getDate();
app.get("/", function(req, res) {

    Item.find({}, function(err, foundItems) {
        res.render("list", {listTitle: day, newListItems: foundItems});
    });

});

app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
    
    List.findOne({name: customListName}, function(err, foundlist) {
        if (!err){
            if (!foundlist) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();

                res.redirect("/" + customListName);
            } else {
                res.render("list", {listTitle: foundlist.name, newListItems: foundlist.items});
            }
        }
    });
});

app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === day) {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundlist) {
            foundlist.items.push(item);
            foundlist.save();
            res.redirect("/" + listName);
        })
    }
    
});

app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === day) {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if (!err){
                console.log("Sucessfully removed the Item.");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate(
            {name: listName},
            {$pull: {items: {_id: checkedItemId}}},
            function (err, foundlist) {
                if (!err) {
                    res.redirect("/" + listName);
                }
            }
        );
    }
});

app.listen(3000, function() {
    console.log("Server satrted on port 3000");
});