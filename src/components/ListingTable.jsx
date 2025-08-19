import React, { useState } from "react";
import { Table } from "reactstrap";
import { IconButton } from "@mui/material";
import { FaTrash } from "react-icons/fa";
// If you have this modal component, import it:
import EditSevaModal from "./EditSevaModal"; // adjust path

const ListingTable = ({ data = [], handleDelete, refreshData }) => {
  const [editModal, setEditModal] = useState(false);
  const [selectedSeva, setSelectedSeva] = useState(null);

  const handleEdit = (item) => {
    setSelectedSeva(item);
    setEditModal(true);
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
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item, index) => (
            <tr key={item.seva_id ?? item.id ?? index}>
              <th scope="row">{index + 1}</th>
              <td>{item.sahyogi_name}</td>
              <td>{item.sahyogi_number}</td>
              <td>{item.book_no}</td>
              <td>{item.reciept_no}</td>
              <td>{item.seva_amount}</td>
              <td>
                <IconButton
                  color="warning"
                  onClick={() => handleEdit(item)}
                  sx={{ mr: 1 }}
                  size="small"
                  title="Edit"
                >
                  <i className="bi fs-6 bi-pencil" />
                  {/* or use MUI icon: <EditIcon fontSize="small" /> */}
                </IconButton>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {editModal && (
        <EditSevaModal
          modal={editModal}
          setModal={setEditModal}
          sevakData={selectedSeva}
          refreshData={refreshData} // pass from props instead of undefined fetchFilledForms
        />
      )}
    </div>
  );
};

export default ListingTable;
