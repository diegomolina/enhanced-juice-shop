import {
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  DataTypes,
  type CreationOptional,
  type Sequelize
} from 'sequelize'

class Passkey extends Model<
InferAttributes<Passkey>,
InferCreationAttributes<Passkey>
> {
  declare id: CreationOptional<number>
  declare UserId: number
  declare credentialID: string
  declare publicKey: string
  declare counter: CreationOptional<number>
  declare transports: CreationOptional<string>
  declare aaguid: CreationOptional<string>
  declare createdAt: CreationOptional<Date>
}

const PasskeyModelInit = (sequelize: Sequelize) => {
  Passkey.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      UserId: {
        type: DataTypes.INTEGER
      },
      credentialID: {
        type: DataTypes.STRING
      },
      publicKey: {
        type: DataTypes.STRING
      },
      counter: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      transports: {
        type: DataTypes.STRING,
        defaultValue: ''
      },
      aaguid: {
        type: DataTypes.STRING,
        defaultValue: '00000000-0000-0000-0000-000000000000'
      },
      createdAt: DataTypes.DATE
    },
    {
      tableName: 'Passkeys',
      sequelize
    }
  )
}

export { Passkey as PasskeyModel, PasskeyModelInit }
