const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { name } = require("ejs");
const _ = require("lodash");
require('dotenv').config();



const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');


// If your password contains special characters like @, #, or !, 
// you need to encode them using percent encoding. For example, @ becomes %40.
mongoose.connect(process.env.mongoDB_Connect_URI)


const itemSchema = {
    name: String
};
const Item = mongoose.model('Item', itemSchema);

const item1 = new Item({
    name: "welcome to todo list"
});
const item2 = new Item({
    name: "Hit + button to add a new item"
});
const item3 = new Item({
    name: "<-- Hit this to deletean item"
});

const defaultItems = [item1, item2, item3];


const listSchema = {
    name: String,
    items: [itemSchema]
};

const List = mongoose.model('List', listSchema);


app.get("/", function (req, res) {
    Item.find()
        .then(function (items) {
            if (items.length === 0) {
                Item.insertMany(defaultItems)
                    .then(function () {
                        console.log("Successfully insert items");
                    }).catch(function (err) {
                        console.log(err);
                    });
                res.redirect("/");
            }
            else {
                res.render("list", { listTitle: "Today", newListItems: items });
            }
        })
        .catch(function (err) {
            console.log(err);
        });

});


app.get("/about", function (req, res) {
    res.render("about");
})

// dynamic pages

app.get("/:customTodoList", function (req, res) {
    const customTodoList =_.capitalize(req.params.customTodoList); 

    List.findOne({ name: customTodoList })
        .then(function (foundList) {
            if (!foundList) {
                // create a new list
                const list = new List({
                    name: customTodoList,
                    items: defaultItems
                });
                list.save();
                // console.log("does'nt found");
                res.redirect(customTodoList);
            }
            else {
                // show an existing list
                res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
                // console.log("found", foundList);
            };
        })
        .catch(function (err) {
            console.log(err);
        });

    // console.log(customTodoList);

});


app.post("/", function (req, res) {

    const itemName = req.body.new_item;
    const listName =req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName==="Today"){
        item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name:listName})
        .then(function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        })
        .catch(function(err){
            console.log(err);
        });

    }
    

});

app.post("/delete", function (req, res) {

    const checkedItemID = req.body.checkbox;
    const listName=req.body.listName;

    if(listName==="Today"){
        Item.findByIdAndDelete(checkedItemID)
        .then(function (docs) {
            console.log("deleted item", docs);
            res.redirect("/");
        })
        .catch(function (err) {
            console.log(err);
        });
    }
    else{
        List.findOneAndUpdate({name:listName},{$pull: {items: {_id: checkedItemID}}})
        .then(function(){
            res.redirect("/"+listName);
        });
    };
    
});

const Port=process.env.PORT
app.listen(Port, function (req, res) {
    console.log("server is running in the port 3000");
})