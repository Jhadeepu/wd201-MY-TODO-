'use strict';
const {
  Model
} = require("sequelize");
const { Op } = require("sequelize")
module.exports = (sequelize, DataTypes) => {
  class Todos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
      static associate(models) {
        Todos.belongsTo(models.User, {
          foreignKey: 'userId'
        });
      }
    // static associate(models) {
    //   Todos.belongsTo(models.Users, {
    //     foreignkey: 'userId'
    //   })
      // define association here
    // }
    static async Overduetask()
  {
    return await Todos.findAll({
      where: {
        dueDate: {
          [Op.lt]: new Date(),
        },
        completed: false,
      }, order: [["id", "ASC"]],
    });
  }
  static async todayTask()
  {
    return await Todos.findAll({
      where: {
        dueDate: {
          [Op.eq]: new Date(),
        },
        completed: false,
      }, order: [["id", "ASC"]],
    });
  }
  static async Latertask(){
    return await Todos.findAll({
      where: { 
        dueDate: {
        [Op.gt]: new Date() 
      },
      completed: false,
    }, order: [["id", "ASC"]]
    })
  }
    static async completed(){
    return await Todos.findAll({
      where: {
        completed: true
      },
      order: [['id', 'ASC']],
    });
  }

  static async incomplete() {
    return await Todos.findAll({
      where: {
        completed: false
      },
      order: [['id', 'ASC']]
    });
  }
    static addTodos({ title, dueDate }) {
    return this.create({
      title: title,
      dueDate: dueDate,
      completed: false
    });
  }

    static async remove(id) {
    return await this.destroy({
      where: {
        id: id,
      },
    });
  }
  setCompletionStatus(status) {
    return this.update({ completed: status });
  }
      static async getTodos() {
    return await this.findAll();
  }
}

Todos.init({
  title: DataTypes.STRING,
  dueDate: DataTypes.DATEONLY,
  completed: DataTypes.BOOLEAN
}, {
  sequelize,
  modelName: 'Todos',
});

return Todos;
}
