import React, { useState, useMemo } from "react";
import { Table } from "reactstrap";
import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { FaTrash } from "react-icons/fa";
import EditSevaModal from "./EditSevaModal";

const ListingTable = ({ data = [], handleDelete, refreshData }) => {
  const [editModal, setEditModal] = useState(false);
  const [selectedSeva, setSelectedSeva] = useState(null);

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // will store numeric/string id

  const list = Array.isArray(data) ? data : [];
  const currency = useMemo(() => new Intl.NumberFormat("en-IN"), []);

  const handleEdit = (item) => {
    setSelectedSeva(item);
    setEditModal(true);
  };

  const requestDelete = (item) => {
    const id = item?.id ?? item?.seva_id ?? null;
    if (!id) return;
    setItemToDelete(id);
    setOpenConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || !handleDelete) return;
    await handleDelete(itemToDelete);
    setOpenConfirmDialog(false);
    setItemToDelete(null);
  };

  return (
    <div>
      <Table striped responsive>
        <thead>
          <tr>
            <th>Sr.</th>
            <th>Sahyogi Name</th>
            <th>Sahyogi Number</th>
            <th>Book no.</th>
            <th>Receipt no.</th>
            <th>Amount</th>
            {/* <th>Action</th> */}
          </tr>
        </thead>

        <tbody>
          {list.map((item, index) => {
            const id = item?.id ?? item?.seva_id ?? `${index}`;
            return (
              <tr key={id}>
                <th scope="row">{index + 1}</th>
                <td>{item?.sahyogi_name || "-"}</td>
                <td>{item?.sahyogi_number || "-"}</td>
                <td>{item?.book_no || "-"}</td>
                <td>{item?.receipt_no || "-"}</td>
                <td>{item?.seva_amount != null ? currency.format(Number(item.seva_amount)) : "-"}</td>
                <td>
                  {/* <IconButton
                    color="warning"
                    onClick={() => handleEdit(item)}
                    sx={{ mr: 1 }}
                    size="small"
                    title="Edit"
                  >
                    <i className="bi fs-6 bi-pencil" />
                  </IconButton> */}

                  {/* {typeof handleDelete === "function" && (
                    <IconButton
                      color="error"
                      onClick={() => requestDelete(item)}
                      size="small"
                      title="Delete"
                    >
                      <FaTrash />
                    </IconButton>
                  )} */}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {/* Delete confirmation */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <p>Are you sure you want to delete this item?</p>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setOpenConfirmDialog(false)} color="primary">
            Cancel
          </Button>
          <Button variant="contained" onClick={confirmDelete} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {editModal && (
        <EditSevaModal
          modal={editModal}
          setModal={setEditModal}
          sevakData={selectedSeva}
          refreshData={refreshData}
        />
      )}
    </div>
  );
};

export default ListingTable;
