const User = require('../models/userModel');
const facturapi = require('../apis/facturapi');

// Obtener todos los usuarios
const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los usuarios', error });
    }
};

// Crear un nuevo usuario
const createUser = async (req, res) => {
    try {
        const user = new User(req.body);
        const facturapiCustomer = await facturapi.createUser(user);
        user.facturapiid = facturapiCustomer.id;
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el usuario', error });
    }
};

// Actualizar un usuario
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const userToUpdate = await User.findById(id);
        if (!userToUpdate) return res.status(404).json({ message: 'Usuario no encontrado' });

        await facturapi.updateUser(userToUpdate.facturapiid, updates);
        Object.assign(userToUpdate, updates);
        const updatedUser = await userToUpdate.save();

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el usuario', error });
    }
};

// Eliminar un usuario
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userToDelete = await User.findById(id);
        if (!userToDelete) return res.status(404).json({ message: 'Usuario no encontrado' });

        const facturapiiiid = '6751322b5b4c47db17831fc1';

        await facturapi.deleteUser(facturapiiiid);
        await User.findByIdAndDelete(id);

        res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el usuario', error });
    }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
