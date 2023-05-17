'use strict';
//const { use } = require("passport");
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
    static async Overduetask(userId)
  {
    return await Todos.findAll({
      where: {
        dueDate: {
          [Op.lt]: new Date(),
        },
        userId,
        completed: false,
      }, order: [["id", "ASC"]],
    });
  }
  static async todayTask(userId)
  {
    return await Todos.findAll({
      where: {
        dueDate: {
          [Op.eq]: new Date(),
        },
        userId,
        completed: false,
      }, order: [["id", "ASC"]],
    });
  }
  static async Latertask(userId){
    return await Todos.findAll({
      where: { 
        dueDate: {
        [Op.gt]: new Date() 
      },
      userId,
      completed: false,
    }, order: [["id", "ASC"]]
    })
  }
    static async completed(userId){
    return await Todos.findAll({
      where: {
        completed: true
      },
      userId,
      order: [['id', 'ASC']],
    });
  }

  static async incomplete(userId) {
    return await Todos.findAll({
      where: {
        completed: false
      },
      userId,
      order: [['id', 'ASC']]
    });
  }
    static addTodos({ title, dueDate , userId }) {
    return this.create({
      title: title,
      dueDate: dueDate,
      completed: false, userId
    });
  }

    static async remove(id, userId) {
    return await this.destroy({
      where: {
        id: id,
        userId: userId
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
