import { useAtom } from "jotai";
import DeleteIcon from "@mui/icons-material/Delete";
import partsStorageAtom from "../../state/partsStorageAtom";


export function SideButtons() {
	const isActive = true;
	const [partsStorage, partsStorageAPI] = useAtom(partsStorageAtom);
	const selectedPart = partsStorage.selectedPart;
	return (
		<div className="SidebuttonsUI-container">
			{selectedPart != null && (
				<div
					id="trash-icon"
					style={{
						position: "absolute",
						top: 24,
						right: 24,
						zIndex: 1000,
						background: isActive ? "#ffdddd" : "#fff",
						borderRadius: 12,
						boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
						padding: 12,
						transition: "background 0.2s",
						border: isActive ? "2px solid #f00" : "2px solid #eee",
					}}
					onClick={() => {
						
					}}
				>
					<DeleteIcon style={{ color: isActive ? "#f00" : "#888", fontSize: 36 }} />
				</div>
			)}
		</div>
	);
}
