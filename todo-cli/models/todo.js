// models/todo.js
"use strict";
const { Model } = require("sequelize");
const { Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static async addTask(params) {
      return await Todos.create(params);
    }
    static async showList() {
      console.log("My Todo list \n");

      console.log("Overdue");
      let Overdue_Items = await this.overdue();
      let Overdue_List = Overdue_Items.map((items) => items.displayableString());
      console.log(Overdue_List.join("\n"));

      console.log("\n");

      console.log("Due Today");
      let Today_List = await this.dueToday();
      let Today_Items = Today_List.map((items) => items.displayableString());
      console.log(Today_Items.join("\n"));
      console.log("\n");

      console.log("Due Later");
      let DueLater_List = await this.dueLater();
      let DueLater_Items = DueLater_List.map((items) =>
        items.displayableString()
      );
      console.log(DueLater_Items.join("\n"));
    }

    static async overdue() {
      return await Todos.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date(),
          },
        },
        order: [["id", "ASC"]],
      });
    }

    static async dueToday() {
      return await Todos.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date(),
          },
        },
        order: [["id", "ASC"]],
      });
    }

    static async dueLater() {
      return await Todos.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date(),
          },
        },
        order: [["id", "ASC"]],
      });
    }

    static async markAsComplete(id) {
      await Todos.update(
        { completed: true },
        {
          where: {
            id: id,
          },
        }
      );
    }

    displayableString() {
      let checkbox = this.completed ? "[x]" : "[ ]";
      const day = new Date(this.dueDate);
      return day.getDate() === new Date().getDate()
        ? `${this.id}. ${checkbox} ${this.title}`
        : `${this.id}. ${checkbox} ${this.title} ${this.dueDate}`;
    }
  }
  Todos.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todos;
};